var async = require("async");
var feePlan = require("../../models/FeePlan").feePlan;
var moment = require("moment");
var _ = require('underscore');
var ForwardRecords = require("../../models/ForwardRecord").ForwardRecords;
var alipay = require("../../config/secrets").alipay;

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
     show_url: "/"
    };

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
  console.log(req.paramas);
  return res.send({pay_notify: "ok"})
}
exports.pay_return_url = function (req, res) {
  // test url
  console.log(req.query);
  // { body: 'undefined',
  // buyer_email: '237009522@qq.com',
  // buyer_id: '2088012501703670',
  // discount: '0.00',
  // gmt_create: '2015-10-26 19:28:05',
  // gmt_logistics_modify: '2015-10-26 19:28:05',
  // gmt_payment: '2015-10-26 19:28:29',
  // is_success: 'T',
  // is_total_fee_adjust: 'N',
  // logistics_fee: '0.00',
  // logistics_payment: 'SELLER_PAY',
  // logistics_type: 'EXPRESS',
  // notify_id: 'RqPnCoPT3K9%2Fvwbh3InVa46BL2SnjetFOQQRk7A8LvEqrwBKCINGJgnGsUkDpkJzeKv7',
  // notify_time: '2015-10-26 19:28:34',
  // notify_type: 'trade_status_sync',
  // out_trade_no: '562e0e11024b2b2110507c05',
  // payment_type: '1',
  // price: '0.01',
  // quantity: '1',
  // receive_address: 'undefined',
  // receive_mobile: 'undefined',
  // receive_name: 'undefined',
  // receive_phone: 'undefined',
  // receive_zip: 'undefined',
  // seller_actions: 'SEND_GOODS',
  // seller_email: 'ljy080829@gmail.com',
  // seller_id: '2088102062322622',
  // subject: '购买 somanyad.com 会员服务: 2015-10-26---2016-10-26',
  // total_fee: '0.01',
  // trade_no: '2015102600001000670062629977',
  // trade_status: 'WAIT_SELLER_SEND_GOODS',
  // use_coupon: 'N',
  // sign: '3a42af9d11cc95e05dfa9d50c86a7b0f',
  // sign_type: 'MD5' }
  return res.send({pay_return: 'ok'});
}
