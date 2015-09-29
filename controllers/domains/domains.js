
var Domain = require("../../models/Domain").Domain;
var Forward = require("../../models/Domain").Forward;
var EmailVerified = require("../../models/Domain").EmailVerified;
var dnslookup = require("../../lib/dnslookup");
var secrets = require("../../config/secrets");
var async = require("async");

var transporter = require("../contact").transporter;

exports.home = function (req, res) {

  return res.render('domains/home', {
        title: "Manage Domains",
        active_item: "home"
      });
}

exports.setup = function (req, res) {
  var domain = req.query.domain

  res.render("domains/setup", {
    domain: domain
  })
}

exports.emails = function (req, res) {

  res.render("domains/emails", {
    active_item: "emails"
  })
}
exports.emails_forward = function (req, res) {
  var domainStr = req.query.domain;
  Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
    if (err) {
      return res.send(err);
    }
    if (domain) {

    }
  })
}

exports.forward = function (req, res) {
  res.render("domains/forward", {
    active_item: "forward"
  })
}


exports.tongji = function (req, res) {
  res.render("domains/tongji", {
    active_item: "tongji"
  })
}

exports.addNewDomain = function (req, res) {
  res.render("domains/addNewDomain", {
    active_item: "domains"
  })
}
exports.addNewDomain_post = function (req, res) {
  var domain = req.body.domain;
  var user = req.user;
  var forward_email = req.body.forward_email;

  async.waterfall([
    // 查找或者创建一条域名记录
    function (done) {
      Domain.findOrCreate({domain: domain, user: user._id}, function (err, domain) {
        done(err, domain)
      })
    },
    // 查找或者创建一条邮箱所有权的记录
    function (domain, done) {
      EmailVerified.findOrCreate({user: user._id, email: forward_email}, function (err, emailVerify) {
        done(err, domain, emailVerify)
      })
    },
    // 发送验证邮箱所有权的邮件
    function (domain, emailVerify, done) {
      var mailOptions = {
        to: forward_email,
        from: secrets.verifyEmailSender,
        subject: '验证邮箱所有权',
        text: '你是否允许用户: '  + req.user.email + '转发邮件给你, 如果允许请点击下面的链接, 或者将下面的链接复制到浏览器地址栏\n\n' +
          'http://' + req.headers.host + '/domains/emailVerify?id=' + emailVerify._id + '&email=' + emailVerify.email + '\n\n' +
          ' 如果不允许, 则无需进行操作.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        req.flash('info', { msg: 'An e-mail has been sent to ' + forward_email + ' with further instructions.' });
        done(err, domain, emailVerify);
      });
    },
    // 关联域名记录与邮箱所有权记录
    function (domain, emailVerify, done) {
      domain.forward_email = emailVerify._id;
      domain.save(function (err) {
        done(err, domain, 'done');
      })
    }],
    // 渲染请求
    function (err, domain) {
      if (err) {
        req.flash('errors', { msg: (err || new Error("create domain failure, please contact adminster!")).message });
        return res.redirect('/domains/addNewDomain');
      }
      return res.redirect("/domains/newDomainSetup?domain=" + domain.domain)
    }
  );
}

exports.newDomainSetup = function (req, res) {
  var domainStr = req.query.domain;
  async.waterfall([
    // 查找该域名
    function (done) {
      Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
        done(err, domain)
      })
    },
    // 查找相关的转发目的地
    function (domain, done) {
      EmailVerified.findOne({_id: domain.forward_email}, function (err, emailV) {
        done(err, domain, emailV)
      });
    }],
    // 渲染
    function (err, domain, emailV) {
      console.log(arguments);
      if (err) {
        res.locals.message = err.message
        return res.render("domains/newDomainSetup", {
          domain: domain || { domain: domainStr },
          err: err,
          mailServers: [],
          cnamePointTo: secrets.cnamePointTo
        });
      }

      var cname = dnslookup.cnameFun(domainStr, req.user._id);
      var mailServers = secrets.mailServers

      domain.email = emailV.email;
      return res.render("domains/newDomainSetup", {
        domain: domain,
        cname: cname,
        mailServers: mailServers,
        cnamePointTo: secrets.cnamePointTo
      });
    }
  );
}


exports.newDomainSetup2 = function (req, res) {
  var domainStr = req.query.domain;
  var emails = [];

  async.waterfall([
    function (done) {
      Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
        done(err, domain);
      });
    },
    function (domain, done) {
      EmailVerified.findOne({_id: domain.forward_email}, function (err, emailV) {
        done(err, domain, emailV)
      })
    }
  ], function (err, domain, emailV) {
    if (err) {
      req.flash("error", err);
      return res.render("domains/newDomainSetup2", {
        domain: domain
      })
    }
    domain.email = emailV.email;
    return res.render("domains/newDomainSetup2", {
      domain: domain
    });
  })
}


//
exports.setupForwardTo = function (req, res) {
  var domainStr = req.query.domain;

  Domain.findOne({domain: domainStr}, function (err, domain) {
    if (err) {
      return res.render("domains/setupForwardTo", {
        domain: domainStr,
        error: err.message
      });
    }

    EmailVerified.find({user: req.user._id}, function (err, emails) {
      if (err) {
        return res.render("domains/setupForwardTo", {
          domain: domainStr,
          emails: []
        });
      }

      return res.render("domains/setupForwardTo", {
        domain: domainStr,
        emails: emails
      });
    })
  })
}
