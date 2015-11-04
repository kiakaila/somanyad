var async = require("async");
var moment = require("moment");
var _ = require('underscore');
var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId;

var freePlan = require("./models").freePlan;
var alipayPlan = require("./models").alipayPlan;

var ForwardRecords = require("../../models/ForwardRecord").ForwardRecords;
var alipay = require("../../config/secrets").alipay;
var router = require('./router');

// 当前用户的购买记录(免费+ 支付宝的)
exports.middleware_plans = function (req, res, next) {
  if (!req.user) {
    return next();
  }
  async.waterfall([
    function (done) {
      // 找到免费的记录
      var q = {user: req.user._id}
      freePlan.find(q, function (err, plans) {
        done(err, plans)
      });
    },
    function (freePlans, done) {
      // 找到付费的记录
      var q = { user: req.user._id}
      alipayPlan.find(q, function (err, plans) {
        done(err, freePlans, plans)
      })
    }
  ], function (err, freePlans, alipayPlans) {
    if (err) {
      console.log(err);
      req.flash('errors', { msg: "查找购买记录失败,请联系管理员"})
      return next(err)
    }
    var plans = _.union(freePlans, alipayPlans).sort(function (plan1, plan2) {
      return plan1.expireAt.getTime() < plan2.expireAt.getTime()
    })
    plans.forEach(function (plan) {
      console.log(plan.feeType, plan.pay_finish);
      plan.member_expireAt = moment(plan.expireAt).format("YYYY-MM-DD");
      plan.member_startAt = moment(plan.startAt).format("YYYY-MM-DD");
    })
    res.locals.plans = plans;
    for (plan of plans) {
      if (plan.pay_finish) {
        res.locals.plan = plan;
        break;
      }
    }
    next();
  })
}
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
  var plan = new freePlan({
    user: req.user._id,
    startAt: moment(),
    expireAt: moment().subtract(-7, "days"),   // 往后七天
  })

  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
    }

    req.flash("success", {msg: "购买成功"})
    return res.redirect( req.baseUrl )
  });
}

// 付费
// 这个应该是给支付宝调用的接口, 应该确保调用者是支付宝
exports.alipay_post = function (req, res) {
  var passCondiction = false;
  var count = parseInt(req.body.count);
  if (count < 1) {
    var err = new Error("购买流量包失败, 请发邮件给管理员, 稍后,管理员会进行处理")
    req.flash("errors", {msg: err.message})
    return res.redirect( req.baseUrl );
  }

  var startAt = res.locals.plan.expireAt || new Date();
  startAt = moment(startAt);
  var expireAt = moment(startAt).subtract(-count, "years")
  var plan_id = ObjectId();
  // 让用户跳转到 支付宝页面
  var order_id_str = plan_id;
  // var order_name_str = "购买 somanyad.com 会员服务: " + startAt.format("YYYY-MM-DD") + "---" + expireAt.format("YYYY-MM-DD")
  var order_name_str = "buy"
  var order_money_str = "" + count * 10;
  order_money_str = "0.01"

  var data = {
    out_trade_no	: order_id_str,
    subject	: order_name_str,
    price	: order_money_str,
    quantity	: "1",
    logistics_fee	: "0",
    logistics_type	: "EXPRESS",
    logistics_payment	: "SELLER_PAY",
    create_partner_trade_by_buyer_notify_url: router.notify_url(req.baseUrl, plan_id),
    show_url: req.headers.origin + req.baseUrl + "/order?id=" + order_id_str
  };

  var plan = new alipayPlan({
    _id: plan_id,
    user: req.user._id,
    startAt: startAt,
    expireAt: expireAt,
    pay_finish: false,
    pay_obj: {
      register_to_pay: data,
      had_send_goods: false
    }
  })
  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
      return res.redirect( req.baseUrl );
    }

   alipay.create_partner_trade_by_buyer(data, res);
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

exports.pay_notify = function (req, res) {
  var plan_id = req.params.plan_id
  if (!plan_id) {
    return res.send("failure");
  }
  alipayPlan.findOne({_id: plan_id}, function (err, plan) {
    if (err) {
      console.log(err);
      return res.send("failure")
    }
    plan.pay_obj.notify_from_alipay = _.extends( plan.pay_obj.notify_from_alipay  || {}, req.body, req.query);
    plan.pay_obj.notify_from_alipay_count += 1;
    if (plan.pay_obj.notify_from_alipay_count >= 2) {
      plan.pay_finish = true;
    }
    plan.save(function (err) {
      if (err) {
        console.log(err);
        return res.send("failure")
      }
      function sendGoods(pid, trade_no) {
        setTimeout(function () {
          try {
            res.locals.plan_id = pid;
            res.locals.trade_no = trade_no;
            // 自动发货
            auto_send_goods(req, res);
            console.log("auto_send_goods success");
          } catch (e) {
            console.log(e);
          } finally {

          }
        }, 0.5 * 1000);
      }
      sendGoods(plan._id, plan.pay_obj.notify_from_alipay.trade_no);
      res.send("success");
    });
  });
}

exports.pay_return_url = function (req, res) {
  // test url
  var out_trade_no = req.query.out_trade_no;
  if (out_trade_no == null) {
    console.log("支付宝跳转失败", req.query);
    req.flash('errors', { msg: "购买未成功, 请联系管理员"})
    return res.redirect( req.baseUrl )
  }
  alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
    if (err || plan == null) {
      console.log(err || new Error("plan was null for out_trade_no:", out_trade_no));
      req.flash("errors", { msg: "找不到订单,请联系管理员"});
      return res.redirect( req.baseUrl )
    }

    plan.pay_obj.pay_to_alipay = req.query;
    plan.pay_finish = true;
    plan.save(function (err) {
      if (err) {
        console.log(err);
        req.flash('errors', { msg: "订单更新失败, 请联系管理员"})
        return res.redirect( req.baseUrl )
      }
      req.flash('success', { msg: "支付宝已经收到你的付款了"})
      res.locals.plan_id = plan._id;
      res.locals.trade_no = plan.pay_obj.pay_to_alipay.trade_no;
      auto_send_goods(req, res)
      res.redirect( req.baseUrl );
    })
  })
}
var auto_send_goods = exports.auto_send_goods = function (req, res) {
  var plan_id = res.locals.plan_id;
  var trade_no = res.locals.trade_no;

  var data = {
     trade_no: trade_no
    ,logistics_name: "好多广告网自动发货部"
    ,invoice_no: plan_id
    ,transport_type: "EXPRESS"
   };
  req.flash('success', { msg: "系统已经开始自动发货了"});
  alipay.send_goods_confirm_by_platform(data, res);
}

exports.order_detail = function (req, res) {
  var id = req.query.id
  alipayPlan.findOne({_id: id, user: req.user._id}, function (err, plan) {

    if (err) {
      console.log(err);
      req.flash('errors', { msg: "查询订单" + id + "出错, 请联系管理员"})
      return res.redirect( req.baseUrl )
    }
    return res.render('members/order', {
      order: plan
    });
  });
}

exports.user_had_pay = function (uid, cb) {

  async.waterfall([
    function (done) {
      // 找到免费的记录
      var q = {user: uid}
      console.log(q);
      freePlan.find(q, function (err, plans) {
        done(err, plans)
      });
    },
    function (freePlans, done) {
      // 找到付费的记录
      var q = { user: uid}
      alipayPlan.find(q, function (err, plans) {
        done(err, freePlans, plans)
      })
    }
  ], function (err, freePlans, alipayPlans) {
    if (err) {
      console.log(err);
      return cb(new Error("没有找到续费记录, 请联系管理员"))
    }
    var plans = _.union(freePlans, alipayPlans).sort(function (plan1, plan2) {
      return plan1.expireAt.getTime() < plan2.expireAt.getTime()
    })

    var now = new Date();
    for (plan of plans) {
      if (plan.pay_finish && plan.expireAt.getTime() > now.getTime()) {
        cb(null)
        break;
      }
    }
    cb(new Error("没有找到购买记录,请联系管理员"))
  });
}
