var async = require("async");
var feePlan = require("./FeePlan").feePlan;
var moment = require("moment");
var _ = require('underscore');
var ForwardRecords = require("../../models/ForwardRecord").ForwardRecords;

// 显示所有域名相关信息
exports.index = function (req, res) {
  // 找到当前付费类型
  // 如果当前没有付费类型,则显示到青铜页面
  return res.render('members/index', {
        active_item: "index"
      });
}

// 购买免费包
exports.free_post = function (req, res) {
  var plan = new feePlan({
    user: req.user._id,
    feeType: "免费",
    startAt: moment(),
    expireAt: moment().subtract(-7, "days"),   // 往后七天

    pay_id: null,
    pay_type: "免费",
    pay_money: 0,
    pay_count: 0,
    pay_finish: true
  })
  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
    }

    req.flash("success", {msg: "购买成功"})
    return res.redirect("/members/")
  });
}

// 付费
// 这个应该是给支付宝调用的接口, 应该确保调用者是支付宝
exports.pay_post = function (req, res) {
  var passCondiction = false;
  var count = parseInt(req.body.count);
  passCondiction = true;
  if (!passCondiction) {
    var err = new Error("购买流量包失败, 请发邮件给管理员, 稍后,管理员会进行处理")
    console.log(err);
    req.flash("error", {msg: err.message})
    return res.redirect("/members/");
  }

  var plan = new feePlan({
    user: req.user._id,
    feeType: "收费",
    startAt: moment(),
    expireAt: moment().subtract(-count, "years"),
    //
    pay_id: "xxxx-xxxxx-xxxx-xxxx",
    pay_type: "支付宝",
    pay_money: "" + count,
    pay_count: count,
    pay_finish: true
  })
  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
    }

    req.flash("success", {msg: "购买成功"});
    return res.redirect("/members/");
  });
}

// 显示最近两周的转发记录
exports.forwardCount = function (req, res) {

  var match = {
    $match: {
      user: req.user._id,
      createdAt: {
        $gte: moment().date(14).toDate()
      }
    }
  };
  var project = {
    $project: {
      _id: 0,
      date: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      },
      createdAt: 1
    }
  };
  var group = {
    $group: {
      // _id: "$date",
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      },
      createdAt: {
        $first: 1
      },
      count: { $sum: 1}
    }
  };
  var sort = {
    $sort: {
      createdAt: 1
    }
  };
  var aggregate = [
      match
    , project
    , group
    , sort
  ]
  ForwardRecords.aggregate(aggregate, function (err, results) {
    if (err) {
      console.log(err);
      req.flash('errors', { msg: "获取数据失败, 请联系管理员"})
    }

    res.send(results);
  });
}
