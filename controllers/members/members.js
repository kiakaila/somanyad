var async = require("async");
var feePlan = require("./FeePlan").feePlan;
var moment = require("moment");
var _ = require('underscore');
var ForwardRecords = require("../../models/ForwardRecord").ForwardRecords;
var pay_order_url_fn = require('./alipayLib').pay_order_url;
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
  if (count < 1) {
    var err = new Error("购买流量包失败, 请发邮件给管理员, 稍后,管理员会进行处理")
    req.flash("errors", {msg: err.message})
    return res.redirect("/members/");
  }

  var startAt = moment()
  var expireAt = moment().subtract(-count, "years")
  var plan = new feePlan({
    user: req.user._id,
    feeType: "收费",
    startAt: startAt,
    expireAt: expireAt,
    //
    pay_type: "支付宝",
    pay_count: count,
    pay_finish: false
  })
  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
      return res.redirect("/members/");
    }

    // 让用户跳转到 支付宝页面
    var order_id_str = plan._id;
    var order_name_str = "购买 somanyad.com 会员服务: " +
                          startAt.format("YYYY-MM-DD") + "---" +
                          expireAt.format("YYYY-MM-DD")
    var order_money_str = "" + count * 10
    var order_about_str = "感谢您的购买,如有任何疑问,请联系我们";
    var url = pay_order_url_fn(order_id_str, order_name_str, order_money_str, order_about_str)
    console.log(url);
    return res.redirect(url);
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
