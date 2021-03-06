
var Domain = require("../models/Domain").Domain;
var Forward = require("../models/Domain").Forward;
var Emails = require("../emails");
var BlackReceiveList = require("../models/Domain").BlackReceiveList;
var dnslookup = require("../../lib/dnslookup");
var secrets = require("../../somanyad/config");
var async = require("async");
var sendMail = require('../../lib/swaks').sendMail;

// 显示所有域名相关信息
exports.home = function (req, res) {

  return res.render('somanyad/domains/home', {
        active_item: "home",
      });
}

// 编辑某域名
exports.edit = function (req, res) {
  var domain_str = req.query.domain;

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

    return res.render('somanyad/domains/edit', {
          title: "Domains",
          active_item: domain_str,
          BlackList: blackList || []
        });
  });
}

// 将某个域名的转发邮件修改为另一个邮件地址
// 要先验证新的地址是否允许转发
exports.change_forward_email_post = function (req, res) {
  var domain_str = req.query.domain;
  var forward_email = req.body.forward_email;

  async.waterfall([
    // 查找之前的转发记录, 或者创建新的
    // 发送验证邮箱所有权的邮件
    function (done) {
      var nickname = req.user.email;
      Emails.sendNewVerifyEmailIfNeed(req.user._id, nickname, forward_email, res.__, function (err, emailVID, passVerify) {
        done(err, emailVID)
      })
    },
    // 关联域名记录与邮箱所有权记录
    function (emailVID, done) {
      var domain = res.locals.domain;
      domain.forward_email = emailVID;
      domain.save(function (err) {
        done(err);
      })
    },
  ], function (err) {
    if (err) {
      req.flash('errors', { msg: err.message })
    } else {
      req.flash('success', { msg: res.__("邮件修改成功") })
    }

    return res.redirect( req.baseUrl + "/edit?domain=" + domain_str);
  })
}

// 添加新域名
exports.addNewDomain = function (req, res) {
  res.render("somanyad/domains/addNewDomain", {
    active_item: "domains"
  })
}
// 添加新域名 -- 提交表单, 如果需要, 则发送邮件所有权验证邮件
exports.addNewDomain_post = function (req, res) {
  var domain_str = req.body.domain;
  var user = req.user;
  var forward_email = req.body.forward_email;

  async.waterfall([
    // 查找或者创建一条域名记录
    function (done) {
      Domain.findOrCreate({domain: domain_str, user: user._id}, function (err, domain) {
        done(err, domain)
      })
    },
    // 查找或者创建一条邮箱所有权的记录
    function (domain, done) {
      Emails.is_verified_address( user._id, forward_email, function (err, is_verified, emailVID) {
        done(err, domain, emailVID)
      })
    },
    // 关联域名记录与邮箱所有权记录
    function (domain, emailVID, done) {
      domain.forward_email = emailVID;
      domain.save(function (err) {
        done(err, domain);
      })
    }],
    // 渲染请求
    function (err, domain) {
      if (err) {
        if (err.code == 11000) {
          err = new Error("该域名( " + domain_str + " )已经被绑定了, 请联系管理员进行操作")
        }
        req.flash('errors', { msg: (err || new Error( res.__("创建域名失败, 请联系管理员"))).message });
        return res.redirect( req.baseUrl + '/addNewDomain');
      }
      return res.redirect( req.baseUrl + "/newDomainSetup?domain=" + domain_str)
    }
  );
}
// 添加新域名 -- 步骤1, 告诉用户怎么设置
// 如果需要, 则发送邮件所有权验证邮件
exports.newDomainSetup = function (req, res) {
  var domain_str = req.query.domain;
  async.waterfall([
    // 查找该域名
    function (done) {
      Domain.findOne({domain: domain_str, user: req.user._id}, function (err, domain) {
        if (domain == null) {
          var msg = "domain: " + domain_str + " user: " + req.user._id;
          console.log(msg);
          if (!err) {
            err = new Error( res.__("数据库无法找到该域名" + msg))
          }
          done(err, null);
          return;
        }
        done(err, domain)
      })
    },
    // 查找相关的转发目的地
    // 发送验证邮箱所有权的邮件
    function (domain, done) {
      // 找到邮箱地址, 如果没有通过验证, 则发送验证邮件
      var emailVID = domain.forward_email;
      var nickname = req.user.email;
      Emails.sendVerifyEmailIfNeed(nickname, emailVID, function (err, email, passVerify) {
        if (err) {
          console.log(err);
          err = new Error( res.__("发送邮件失败, 请联系管理员"));
          req.flash('errors', { msg: err.message })
        }
        if (!passVerify) {
          req.flash('info', { msg: res.__("已经发送验证链接到你的邮箱: %s , 请点击里面的链接", email)});
        }
        done(err, domain, email, passVerify)
      })
    }],
    // 渲染
    function (err, domain, email, passVerify) {
      var cname = dnslookup.cnameFun(domain_str, req.user._id);
      var mailServers = secrets.mailServers;
      if (domain) {
        domain.email = email;
        domain.email_hadVerify = passVerify;
      }

      if (err) {
        // res.locals.message = err.message
        return res.render("somanyad/domains/newDomainSetup", {
          domain: domain || { domain: domain_str },
          err: err,
          cname: cname,
          mailServers: mailServers,
          cnamePointTo: secrets.cnamePointTo
        });
      }

      return res.render("somanyad/domains/newDomainSetup", {
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
  var domain_str = req.query.domain;
  var emails = [];

  async.waterfall([
    // 查找相关域名记录
    function (done) {
      Domain.findOne({domain: domain_str, user: req.user._id}, function (err, domain) {
        done(err, domain);
      });
    },
    // 查找域名的转发邮件记录
    function (domain, done) {
      var emailVID = domain.forward_email
      Emails.getPassVerifyAndAddressById( emailVID, function (err, is_verified, email) {
        var emailV = {passVerify: is_verified, email: email}
        done(err, domain, emailV);
      });
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
      return res.render("somanyad/domains/newDomainSetup2", {
        domain: domain
      });
    }

    domain.email = emailV.email;
    domain.email_hadVerify = emailV.passVerify;
    return res.render("somanyad/domains/newDomainSetup2", {
      domain: domain
    });
  });
}

// 域名删除
exports.deleteDomain = function (req, res) {
  var domain_str = req.query.domain;

  return res.render("somanyad/domains/deleteDomain", {
    domain: domain_str
  });
}

// 域名删除
// middleware.userOwnerDomain
exports.deleteDomain_post = function (req, res) {
  var domain_str = req.query.domain;
  Domain.remove({domain: domain_str, user: req.user._id}, function (err, domains) {
    if (err || domains == null) {
      err = err || new Error( res.__("没有找到域名: %s", domain_str) );
      req.flash('errors', { msg: err.message });
    }
    return res.render("somanyad/domains/deleteDomain2", {
      msg: err == null ?  "删除成功" : "删除失败, 请联系管理员"
    });
  })
}


// 验证允许转发的邮件地址
exports.emailVerify = function (req, res) {
  var email = req.query.email;
  var emailVID = req.query.id;

  Emails.verifyAddress(emailVID, email, res.__, function (err, passVerify) {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.render('somanyad/domains/emailVerify');
    };
    return res.render('somanyad/domains/emailVerify', {
      passVerify: passVerify,
      email: email
    });
  });
}
