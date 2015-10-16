var async = require("async");
var freeFeePlan = require("../../models/FeePlan").freeFeePlan;
var feePlan = require("../../models/FeePlan").feePlan;
var moment = require("moment");
var _ = require('underscore');

// 显示所有域名相关信息
exports.index = function (req, res) {
  // 找到当前付费类型
  // 如果当前没有付费类型,则显示到青铜页面

  return res.render('members/index', {
        active_item: "index"
      });
}

// 青铜流量包续期
exports.qingtong_post = function (req, res) {
  // 用户当前是否是流量包
  // 如果当前是流量包, 且不是青铜流量包
  //    无法续期

  var obj = {
    user: req.user._id,
    feeType: "qingtong",
    startAt: moment(),
    expireAt: moment().subtract(-7, "days")   // 往后七天
  }
  freeFeePlan.findOrCreate(obj, function (err, qingtongPlan) {
    if (err) {
      req.flash("error", {msg: err.message})
    }
    if (qingtongPlan) {
      req.flash("success", {msg: "购买成功"})
    }

    return res.redirect("/members/")
  });
}

// 付费流量包创建
// 这个应该是给支付宝调用的接口, 应该确保调用者是支付宝
exports.feeplan_post = function (req, res) {
  var passCondiction = false;
  var count = parseInt(req.body.count);
  var feeType = req.query.feeType || req.body.feeType;
  passCondiction = true;
  if (!passCondiction) {
    req.flash("error", {msg: "购买流量包失败, 请发邮件给管理员, 稍后,管理员会进行处理"})
    return res.redirect("/members/");
  }

  // // 付了多少钱
  // pay_money: String,
  // // 购买流量包个数(月)
  // pay_count: Number,
  // // 是否已经付款, 可能要先跳转到支付宝, 然后在跳转回来
  // pay_finish: { type: Boolean, default: false }

  var obj = {
    user: req.user._id,
    feeType: feeType,
    expireAt: moment().subtract(-count, "years")
  }
  // 下面这些, 需要根据真实内容进行替换
  obj = _.extend(obj, {
    pay_id: "xxxx-xxxxx-xxxx-xxxx",
    pay_type: "支付宝",
    pay_money: "" + count,
    pay_count: count,
    pay_finish: true,
  })
  feePlan.findOrCreate(obj, function (err, feePlan) {
    if (err) {
      req.flash("error", {msg: err.message});
    }
    if (feePlan) {
      req.flash("success", {msg: "购买成功"})
    }
    return res.redirect("/members/");
  });
}

exports.getAvailableCount = function (uid, cb) {

  var obj = {
    user: uid,
    expireAt: {
      $gte: moment()
    }
  }
  async.parallel([
    function (done) {
      freeFeePlan.findOne(obj).sort({expireAt: 1}).exec(function (err, qingtongPlan) {
        qingtongPlan = qingtongPlan || {};
        var count = qingtongPlan.totalForwardCount - qingtongPlan.usedForwardCount
        if (!count || count < 0) {
          count = 0
        }
        done(null, count);
      })
    },
    function (done) {
      feePlan.find(obj, function (err, plans) {
        var count = plans.reduce(function (previous, elem) {
          return previous + elem.totalForwardCount - elem.usedForwardCount
        }, 0)
        done(null, count);
      })
    }
  ], function (err, results) {
    var qingtongCount = results[0];
    var feePlanCount = results[1];
    cb(qingtongCount + feePlanCount)
  });
}
