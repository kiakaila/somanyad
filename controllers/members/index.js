
var router = require("express").Router();
var async = require("async");
var dnslookup = require("../../lib/dnslookup");
var feePlan = require("../../models/FeePlan").feePlan;
var m = require("moment");

var members = require("./members");

router.use(function (req, res, next) {
  res.locals.title = "Members";
  res.locals.accountId = dnslookup.calSuffix(req.user._id.toHexString(), 5);
  next();
})

router.use(function (req, res, next) {

  var q = {
    user: req.user._id,
    expireAt: {
      $gte: m().subtract(1, "days") // 往后延一天
    }
  }

  feePlan.find(q).sort({expireAt: 1}).exec(function (err, plans) {
    plans = plans || [];
    plans.forEach(function (plan) {
      plan.member_expireAt = m(plan.expireAt).format("YYYY-MM-DD");
      plan.member_startAt = m(plan.startAt).format("YYYY-MM-DD");
    });
    res.locals.plans = plans;
    next();
  });
});


// 显示所有域名相关信息
router.get('/', members.index);
router.post('/free', members.free_post);
router.post('/pay', members.pay_post);
// 显示最近两周的转发记录
router.get('/forwardCount', members.forwardCount);
router.get('/aplipay/create_partner_trade_by_buyer/notify_url', members.pay_notify);
router.get('/aplipay/create_partner_trade_by_buyer/return_url', members.pay_return_url);

exports.router = router;
