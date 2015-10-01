
var emailVerify = require("./api_emailVerify");
var domains = require("./domains");
var domains_api = require("./api_domains");
var router = require("express").Router();
var Domain = require("../../models/Domain").Domain;
var EmailVerified = require("../../models/Domain").EmailVerified;
var async = require("async");

function locals_domains (req, res, next) {

  async.series([
    function (done) {
      EmailVerified.find({user: req.user._id}, function (err, emailVs) {
        done(err, emailVs);
      });
    },
    function (done) {
      Domain.find({user: req.user._id}, function (err, domains) {
        done(err, domains);
      });
    }
  ], function (err, results) {
    if (err) {
      req.flash("error", err);
    }
    var emailVs = results[0];
    var domains = results[1];

    for (domainIdx in domains) {
      for (emailVIdx in emailVs) {
        var domain = domains[domainIdx];
        var emailV = emailVs[emailVIdx];
        if (domain.forward_email_is(emailV)) {
          domain.email = emailV.email
        }
      }
    }
    res.locals.domains = domains || []
    next();
  })

}

function userOwnerDomain(req, res, next) {
  var domainStr = req.query.domain || req.body.domain;
  if (domainStr != null) {
    async.waterfall([
      function (done) {
        Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
          res.locals.domain = domain;
          done(err, domain);
        })
      },
      function (domain, done) {
        EmailVerified.findOne({_id: domain.forward_email}, function (err, emailV) {
          domain.email = (emailV || {}).email
          done(err);
        })
      }
    ], function (err) {
      next(err);
    })
  }
}

router.use(locals_domains);
// router.use(userOwnerDomain);
// 显示所有域名相关信息
router.get('/', domains.home);
// 编辑某域名
router.get("/edit", userOwnerDomain, domains.edit);
// 将某个域名的转发邮件修改为另一个邮件地址
router.post("/edit/forward_email", userOwnerDomain, domains.change_forward_email_post);
// 为某域名添加黑名单
router.post("/edit/addBlackList", userOwnerDomain, domains.addBlackList_post);
// 修改黑名单回退信息
router.post("/edit/changeBlackItemReplyinfo", userOwnerDomain, domains.changeBlackItemReplyinfo_post);
// 删除某条黑名单
router.get("/edit/removeBlackItem", userOwnerDomain, domains.removeBlackItem);

// router.get('/emails', domains.emails)
// router.get('/forward', domains.forward);
// router.get('/tongji', domains.tongji);


// 添加新域名
router.get("/addNewDomain", domains.addNewDomain);
// 添加新域名 -- 提交表单,
router.post("/addNewDomain", domains.addNewDomain_post);
// 添加新域名 -- 步骤1, 告诉用户怎么设置
// 如果需要, 则发送邮件所有权验证邮件
router.get("/newDomainSetup", domains.newDomainSetup);
// 添加新域名 -- 完成
router.get("/newDomainSetup2", domains.newDomainSetup2);




router.get("/api_cnameVerifyStatus", domains_api.cnameVerifyStatus);
router.get("/api_mxVerifyStatus", domains_api.mxVerifyStatus);
router.get("/setupForwardTo", domains.setupForwardTo);
router.get("/setup", domains.setup);
router.get("/api_addForwardEmail", emailVerify.addForwardEmail);
router.get("/api_emailVerify", emailVerify.emailVerify);
router.get("/api_emailVerifyList", emailVerify.emailVerifyList);
router.get("/api_removeEmailVerify", emailVerify.removeEmailVerify);


exports.router = router;
