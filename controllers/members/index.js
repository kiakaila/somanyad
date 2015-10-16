
var router = require("express").Router();
var async = require("async");
var dnslookup = require("../../lib/dnslookup");
var freeFeePlan = require("../../models/FeePlan").freeFeePlan;
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
      $gte: m().subtract(1, "days")
    }
  }

  async.parallel([
    // 免费流量包
    function (done) {
      freeFeePlan.findOne(q).sort({expireAt: 1}).exec(function (err, freeFeePackage) {
        done(err, freeFeePackage);
      });
    },
    // 付费流量包
    function (done) {
      feePlan.find(q).sort({expireAt: 1}).exec(function (err, plans) {
        done(err, plans);
      });
    }
  ], function (err, results) {
    // 青铜流量包 (只有一个)
    var freeFeePackage = results[0];

    // 付费流量包 (可以有多个)
    var feePlanPackages = results[1];
    if (err) {
      req.flash("error", { msg: err.message });
    }


    // 格式化数据
    function formatDate(plan) {
      if (!plan) return;
      plan.member_expireAt = m(plan.expireAt).format("YYYY-MM-DD");
      plan.member_startAt = m(plan.startAt).format("YYYY-MM-DD");
      switch (plan.feeType) {
        case "baijin":
          plan.member_type = "白银流量包"
          break;
        case "huangjin":
          plan.member_type = "黄金流量包"
          break;
        case "chaoji":
          plan.member_type = "超级流量包"
          break;
        default:
          plan.member_type = "青铜流量包"
          break;
      }
    }
    formatDate(freeFeePackage);
    feePlanPackages.forEach(formatDate);
    res.locals.freeFeePlan = freeFeePackage;
    res.locals.feePlans = feePlanPackages;
    next();
  });
})

// 显示所有域名相关信息
router.get('/', members.index);
router.post('/qingtong', members.qingtong_post);
router.post('/feeplan', members.feeplan_post);

exports.router = router;
