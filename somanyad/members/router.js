var passportConf = require('../../config/passport');

var router = require("express").Router();
var async = require("async");
var dnslookup = require("../../lib/dnslookup");
var feePlan = require("./models").feePlan;
var m = require("moment");

var members = require("./members");

router.use(function (req, res, next) {
  res.locals.title = "Members";
  if (req.user)
    res.locals.accountId = dnslookup.calSuffix(req.user._id.toHexString(), 5);
  next();
})


// 显示所有域名相关信息
router.get('/', passportConf.isAuthenticated, members.middleware_plans, members.index);
router.post('/free', passportConf.isAuthenticated, members.middleware_plans, members.free_post);
router.post('/pay', passportConf.isAuthenticated, members.middleware_plans, members.alipay_post);
router.get('/gotopay', passportConf.isAuthenticated, members.middleware_plans, members.gotopay);
// 显示最近两周的转发记录
// router.get('/forwardCount', passportConf.isAuthenticated, members.middleware_plans, members.forwardCount);
router.post('/aplipay/create_partner_trade_by_buyer/:pid/notify_url', members.easy_pay);
// router.all('/aplipay/create_partner_trade_by_buyer/notify_url', members.create_partner_trade_by_buyer_notify);
// router.get('/auto_send_goods', members.auto_send_goods);
router.get('/aplipay/create_partner_trade_by_buyer/return_url', members.middleware_plans, members.pay_return_url);
// // 订单详情
// router.get('/order', passportConf.isAuthenticated, members.order_detail)

exports.router = router;
