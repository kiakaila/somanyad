
var Domain = require("../../models/Domain").Domain;
var Forward = require("../../models/Domain").Forward;
var EmailVerify = require("../../models/Domain").EmailVerify;
var BlackReceiveList = require("../../models/Domain").BlackReceiveList;
var dnslookup = require("../../lib/dnslookup");
var secrets = require("../../config/secrets");
var async = require("async");

var transporter = require("../contact").transporter;

// 显示所有域名相关信息
exports.home = function (req, res) {

  async.waterfall([], function (err, receiveMailCount) {
    return res.render('domains/home', {
          active_item: "home",
        });
  })

}

// 编辑某域名
exports.edit = function (req, res) {
  var domainStr = req.query.domain;

  async.waterfall([
    function (done) {
      BlackReceiveList.find({user: req.user._id, domain: res.locals.domain._id}, function (err, blackList) {
        done(err, blackList)
      })
    }
  ], function (err, blackList) {
    if (err) {
      req.flash('errors', { msg: err.message });
    }

    console.log(arguments);
    return res.render('domains/edit', {
          title: "Manage Domains",
          active_item: domainStr,
          BlackList: blackList || []
        });
  });
}

// 将某个域名的转发邮件修改为另一个邮件地址
// 要先验证新的地址是否允许转发
exports.change_forward_email_post = function (req, res) {
  var domainStr = req.query.domain;
  var forward_email = req.body.forward_email;

  async.waterfall([
    // 查找之前的转发记录,
    function (done) {
      EmailVerify.findOrCreate({user: req.user._id, email: forward_email}, function (err, emailV) {
        done(err, emailV)
      })
    },
    // 发送验证邮箱所有权的邮件
    function (emailVerify, done) {

      if (emailVerify.passVerify) {
        done(null, emailVerify);
        return;
      }
      // 如果这个记录没有通过验证, 那么需要发送验证邮件
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
        done(err, emailVerify);
      });
    },
    // 关联域名记录与邮箱所有权记录
    function (emailVerify, done) {
      var domain = res.locals.domain;
      domain.forward_email = emailVerify._id;
      domain.save(function (err) {
        done(err, domain, 'done');
      })
    },
  ], function (err) {
    if (err) {
      req.flash('errors', { msg: err.message })
    }
    return res.redirect("/domains/edit?domain=" + domainStr);
  })
}

// 添加新域名
exports.addNewDomain = function (req, res) {
  res.render("domains/addNewDomain", {
    active_item: "domains"
  })
}
// 添加新域名 -- 提交表单, 如果需要, 则发送邮件所有权验证邮件
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
      EmailVerify.findOrCreate({user: user._id, email: forward_email}, function (err, emailVerify) {
        done(err, domain, emailVerify)
      })
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
// 添加新域名 -- 步骤1, 告诉用户怎么设置
// 如果需要, 则发送邮件所有权验证邮件
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
      EmailVerify.findOne({_id: domain.forward_email}, function (err, emailV) {
        err = err ||
              emailV == null ? new Error("never found email record") : null;
        done(err, domain, emailV)
      });
    },
    // 发送验证邮箱所有权的邮件
    function (domain, emailVerify, done) {
      if (emailVerify.passVerify) {
        return done(null, domain, emailVerify)
      }
      // 如果这个记录没有通过验证, 那么需要发送验证邮件
      var mailOptions = {
        to: emailVerify.email,
        from: secrets.verifyEmailSender,
        subject: '验证邮箱所有权',
        text: '你是否允许用户: '  + req.user.email + '转发邮件给你, 如果允许请点击下面的链接, 或者将下面的链接复制到浏览器地址栏\n\n' +
          'http://' + req.headers.host + '/domains/emailVerify?id=' + emailVerify._id + '&email=' + emailVerify.email + '\n\n' +
          ' 如果不允许, 则无需进行操作.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        // ???? 这个有生效吗 ???
        req.flash('info', { msg: 'An e-mail has been sent to ' + emailVerify.email + ' with further instructions.' });
        done(err, domain, emailVerify);
      });
    }],
    // 渲染
    function (err, domain, emailV) {

      if (err) {
        // res.locals.message = err.message
        req.flash('errors', { msg: err.message })
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
      domain.email_hadVerify = emailV.passVerify;
      return res.render("domains/newDomainSetup", {
        domain: domain,
        cname: cname,
        mailServers: mailServers,
        cnamePointTo: secrets.cnamePointTo
      });
    }
  );
}

// 添加新域名 -- 完成
exports.newDomainSetup2 = function (req, res) {
  var domainStr = req.query.domain;
  var emails = [];

  async.waterfall([
    // 查找相关域名记录
    function (done) {
      Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
        done(err, domain);
      });
    },
    // 查找域名的转发邮件记录
    function (domain, done) {
      EmailVerify.findOne({_id: domain.forward_email}, function (err, emailV) {
        done(err, domain, emailV)
      })
    },
    // 查看 cname 验证情况
    function (domain, emailV, done) {
      dnslookup.domainVerify(domain.domain, req.user._id, function (err) {
        if (err) {
          domain.cname_hadVerify = false;
          // 定时, 两小时后,自动检测是否
          setTimeout(function () {
            dnslookup.domainVerify(domain.domain, req.user._id, function (err) {
              if (err) {
                domain.cnameVerifyStatus = false;
              } else {
                domain.cnameVerifyStatus = true;
              }
              domain.save();
            })
          }, 2 * 60 * 60);
        } else {
          domain.cname_hadVerify = true;
        }
        domain.cnameVerifyStatus = domain.cname_hadVerify;
        domain.save(function (err) {
          done(err, domain, emailV);
        });
      });
    },
    // 查看 mx 指向情况
    function (domain, emailV, done) {
      dnslookup.mxVerify(domain.domain, secrets.mailServers, function (err) {
        if (err) {
          domain.mx_hadVerify = false;
          // 定时, 两小时后,自动检测是否
          setTimeout(function () {
            dnslookup.mxVerify(domain.domain, secrets.mailServers, function (err) {
              if (err) {
                domain.mxVerifyStatus = false;
              } else {
                domain.mxVerifyStatus = true;
              }
              domain.save();
            })
          }, 2 * 60 * 60);
        } else {
          domain.mx_hadVerify = true;
        }
        domain.mxVerifyStatus = domain.mx_hadVerify;
        domain.save(function (err) {
          done(err, domain, emailV);
        });
      });
    }
  ], function (err, domain, emailV) {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.render("domains/newDomainSetup2", {
        domain: domain
      });
    }
    domain.email = emailV.email;
    domain.email_hadVerify = emailV.passVerify;
    return res.render("domains/newDomainSetup2", {
      domain: domain
    });
  });
}

// 域名删除
exports.deleteDomain = function (req, res) {
  var domainStr = req.query.domain;

  return res.render("domains/deleteDomain", {
    domain: domainStr
  });
}

// 域名删除
// middleware.userOwnerDomain
exports.deleteDomain_post = function (req, res) {
  var domainStr = req.query.domain;
  Domain.remove({domain: domainStr, user: req.user._id}, function (err, domains) {
    if (err || domains == null) {
      err = err || new Error("not found domain: " + domainStr);
      req.flash('errors', { msg: err.message });
    }
    return res.render("domains/deleteDomain2", {
      msg: err == null ?  "删除成功" : "删除失败, 请联系管理员"
    });
  })
}


// 验证允许转发的邮件地址
exports.emailVerify = function (req, res) {
  var id = req.query.id;
  var email = req.query.email;

  EmailVerify.findOne({_id: id, email: email}, function (err, emailV) {
    if (err || emailV == null) {
      req.flash('errors', (err || new Error("email verify record not found!")));
      console.log(err, emailV);
      return res.render("domains/emailVerify");
    } else {
      emailV.passVerify = true;
      emailV.save(function (err) {
        if (err) {
          req.flash('errors', { msg: err.message });
        }
        console.log(err, emailV);
        res.locals.emailV = emailV;
        return res.render("domains/emailVerify");
      });
    }
  });
}
