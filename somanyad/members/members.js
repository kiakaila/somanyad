var async = require("async");
var moment = require("moment");
var _ = require('underscore');
var mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId;

var freePlan = require("./models").freePlan;
var alipayPlan = require("./models").alipayPlan;
var ExpireNotifyAddress = require("../expireNotifyAddress");
var Domain = require("../models/Domain").Domain;

var secrets = require("../../somanyad/config");

var sendMail = require('../../lib/swaks').sendMail;
var ForwardRecords = require("../models/ForwardRecord").ForwardRecords;
var alipay = require("../../somanyad/config").alipay;

alipay.on('verify_fail', function(){console.log('emit verify_fail')})
	// .on('create_direct_pay_by_user_trade_finished', function(out_trade_no, trade_no){})
	// .on('create_direct_pay_by_user_trade_success', function(out_trade_no, trade_no){})
	// .on('refund_fastpay_by_platform_pwd_success', function(batch_no, success_num, result_details){})
	.on('create_partner_trade_by_buyer_wait_buyer_pay', function(out_trade_no, trade_no, args){
    // 等待用户付钱到支付宝
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      plan.status.push("等待用户付款")
      plan.trade_no = trade_no;
      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "等待用户付款 更新出错", err);
        }
      });
    })
  })
	.on('create_partner_trade_by_buyer_wait_seller_send_goods', function(out_trade_no, trade_no, args){
    // 需要发货
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      if (err || plan == null) {
        console.log("需要发货,查询订单失败", err);
        return;
      }
      plan.had_send_goods += 1;
      plan.status.push("发货尝试" + plan.had_send_goods )
      plan.pay_obj.notify_from_alipay = args;
      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "发货尝试状态保存失败", err);
          return;
        }
        var data = {
           trade_no: trade_no
          ,logistics_name: "好多广告网自动发货部"
          ,invoice_no: plan._id
          ,transport_type: "EXPRESS"
         };
        alipay.send_goods_confirm_by_platform(data);
      });
    })
  })
	.on('create_partner_trade_by_buyer_wait_buyer_confirm_goods', function(out_trade_no, trade_no, args){
    // 等待用户确认收货
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      if (err || plan == null) {
        console.log("等待用户确认收货,查询订单失败", err);
        return;
      }
      plan.status.push("等待用户确认收货")
      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "等待用户确认收货", err);
          return;
        }
      });
    })
  })
	.on('create_partner_trade_by_buyer_trade_finished', function(out_trade_no, trade_no, args){
    // 交易完成
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      if (err || plan == null) {
        console.log("订单已生效,查询订单失败", err);
        return;
      }
      plan.status.push("订单已生效")
      plan.pay_finish = true;
      updateExpireNotifyByPlan(plan, function (err) {
        err && console.log("更新到期提醒计划失败", err, plan.user)
      })
      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "订单已生效", err);
          return;
        }
      });
    })
  })
	.on('send_goods_confirm_by_platform_fail', function(error, out_trade_no, trade_no){
    // 发货失败需要再次发货
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      if (err || plan == null) {
        console.log("需要发货,查询订单失败", err);
        return;
      }
      var need_send = false;
      if (plan.had_send_goods >= 5) {
        console.log("已经尝试发货超过5次, 不在尝试发货");
        plan.status.push("已经尝试发货超过5次, 不在尝试发货")
      } else {
        need_send = true;
        plan.had_send_goods += 1;
        plan.status.push("发货尝试" + plan.had_send_goods )
      }

      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "发货尝试状态保存失败", err);
          return;
        }
        if (need_send) {
          var data = {
             trade_no: trade_no
            ,logistics_name: "好多广告网自动发货部"
            ,invoice_no: plan._id
            ,transport_type: "EXPRESS"
           };
          alipay.send_goods_confirm_by_platform(data);
        }
      });
    })
  })
	.on('send_goods_confirm_by_platform_success', function(out_trade_no, trade_no, xml){
    // 发货成功
    alipayPlan.findOne({_id: out_trade_no}, function (err, plan) {
      if (err || plan == null) {
        console.log("交易完成,查询订单失败", err);
        return;
      }
      plan.status.push("发货成功")
      plan.save(function (err) {
        if (err) {
          console.log(out_trade_no, trade_no, "交易完成", err);
          return;
        }
      });
    })
  })
	// .on('trade_create_by_buyer_wait_buyer_pay', function(out_trade_no, trade_no){})
	// .on('trade_create_by_buyer_wait_seller_send_goods', function(out_trade_no, trade_no){})
	// .on('trade_create_by_buyer_wait_buyer_confirm_goods', function(out_trade_no, trade_no){})
	// .on('trade_create_by_buyer_trade_finished', function(out_trade_no, trade_no){});


// cb(plans) plans = plans || []
function findAllPlanSortByExpire(uid, cb) {
  if (uid == null) {
    return cb([]);
  }
  async.waterfall([
    function (done) {
      // 找到免费的记录
      var q = {user: uid}
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
      console.log("查找用户的会员计划失败: ",err);
      return cb([])
    }
    var plans = _.union(freePlans, alipayPlans)
    plans.sort(function (plan1, plan2) {
      return plan1.expireAt.getTime() < plan2.expireAt.getTime()
    })
    return cb(plans)
  })
}
// cb(plan)  plan = plan || null
function findLastPlan(user, cb) {
  findAllPlanSortByExpire(user, function (plans) {
    for (plan of plans) {
      if (plan.pay_finish) {
        return cb(plan)
      }
    }
    cb(null)
  })
}

// 根据plan 更新到期提醒情形
// cb(err)
function updateExpireNotifyByPlan(plan, cb) {
  // 如果是比较旧的日期,就更新提醒计划
  ExpireNotifyAddress.updateExpireTimeIfIsLaterExpireTime(plan.expireAt, function (err) {
    cb(err);
  });
}


exports.middleware_expireNotifyAddress = function (req, res, next) {
  if (!req.user) {
    return next();
  }
  // 查找用户的到期提醒地址
  var user = req.user._id;
  ExpireNotifyAddress.findUserNotifyEmailAddress(user, function (err, notify_email) {
    if (err) {
      console.log(err);
      // req.flash('errors', { msg: res.__("查找用户的到期提醒地址失败")});
      return next();
    }
    res.locals.notify_email = notify_email || "";
    return next();
  });
}
// 当前用户的购买记录(免费+ 支付宝的)
exports.middleware_plans = function middleware_plans (req, res, next) {
  if (!req.user) {
    return next();
  }
  findAllPlanSortByExpire(req.user._id, function (plans) {
    res.locals.plan = null;  // 这个很严重的错误是哪边导致的??? express, jade ? 会遗留上个request的 plan
    plans.forEach(function (plan) {
      plan.member_createdAt = moment(plan.createdAt).format("YYYY-MM-DD")
      plan.member_expireAt = moment(plan.expireAt).subtract(1, "days").format("YYYY-MM-DD");
      plan.member_startAt = moment(plan.startAt).format("YYYY-MM-DD");
    });

    for (plan of plans) {
      if (plan.pay_finish) {
        res.locals.plan = plan;
        break;
      }
    }
    plans.sort(function (plan1, plan2) {
      var diff = plan1.createdAt.getTime() - plan2.createdAt.getTime();
      return -diff;
    })
    res.locals.plans = plans;
    next();
  });
}

// 显示所有域名相关信息
exports.index = function (req, res) {
  // 找到当前付费类型
  // 如果当前没有付费类型,则显示到青铜页面
  return res.render('somanyad/members/index', {
        active_item: "index"
      });
}

exports.update_plan_expire_notify_address = function (req, res) {
  var notify_email = req.body.notify_email;
  var user = req.user._id;

  var expireAt = res.locals.plan && res.locals.plan.expireAt || new Date();
  ExpireNotifyAddress.updateNotifyEmail(user, notify_email, expireAt, function (err) {
    if (err) {
      req.flash("errors", { msg: res.__("更新到期提醒地址失败")})
      return res.redirect( req.baseUrl );
    };

    req.flash('success', { msg: res.__("更新到期提醒地址成功")});
    return res.redirect( req.baseUrl );
  });
}

// 购买免费包
exports.free_post = function (req, res) {
  var plan = new freePlan({
    user: req.user._id,
    startAt: moment(),
    expireAt: moment().subtract(-10, "days"),
    duration: "10天",
  })

  plan.save(function (err) {
    if (err) {
      console.log(err);
      req.flash("error", {msg: err.message});
    }

    req.flash("success", {msg: "购买成功"})
    findLastPlan(req.user._id, function (plan) {
      updateExpireNotifyByPlan(plan, function (err) {
        if (err) {
          err = new Error(res.__("无法更新到期提醒计划!!!"))
        }
        return res.redirect( req.baseUrl )
      })
    })
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

  var startAt =  res.locals.plan && res.locals.plan.expireAt || new Date();
  startAt = moment(startAt);
  var expireAt = moment(startAt).subtract(-count, "years")
  var plan_id = ObjectId();
  // 让用户跳转到 支付宝页面
  var order_id_str = plan_id;
  var order_name_str = "购买 somanyad.com 会员服务: " + startAt.format("YYYY-MM-DD") + "---" + expireAt.format("YYYY-MM-DD")
  var order_money_str = "" + count * 10;
  if (req.user && req.user.email == "ljy080829@gmail.com") {
    order_money_str = "0.01"
  }

  var create_partner_trade_by_buyer_notify_url = 'http://somanyad.com/members/aplipay/create_partner_trade_by_buyer/'+ order_id_str +'/notify_url';

  var data = {
    out_trade_no	: order_id_str,
    subject	: order_name_str,
    price	: order_money_str,
    quantity	: "1",
    logistics_fee	: "0",
    logistics_type	: "EXPRESS",
    logistics_payment	: "SELLER_PAY",
    create_partner_trade_by_buyer_notify_url: create_partner_trade_by_buyer_notify_url,
    show_url: req.headers.origin + req.baseUrl
  };

  var plan = new alipayPlan({
    _id: plan_id,
    user: req.user._id,
    startAt: startAt,
    expireAt: expireAt,
    duration: "" + count + "年",
    pay_finish: false,
    status: ["已创建"],
    pay_obj: {
      register_to_pay: data,
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
exports.gotopay = function (req, res) {
  var id = req.query.id;
  var uid = req.user._id;
  alipayPlan.findOne({_id: id, user: uid}, function (err, plan) {
    if (err || plan == null) {
      err = err || new Error("找不到订单:", id)
      console.log(err);
      req.flash('errors', { msg: '网络出错, 请联系管理员'})
      return res.redirect( req.baseUrl )
    }
    plan.notify_url_count = 0;
    plan.save(function (err) {
      if (err) {
        console.log(err);
        req.flash('errors', { msg: '网络出错,请联系管理员'})
        return res.redirect( req.baseUrl )
      }
      var data = plan.pay_obj.register_to_pay;
      alipay.create_partner_trade_by_buyer(data, res);
    });
  });
}
exports.easy_pay = function (req, res) {
  var id = req.params.pid;
  alipayPlan.findOne({_id: id}, function (err, plan) {
    if (err || plan == null) {
      err = err || new Error( res.__("找不到订单: %s", id))
      console.log(err);
      return res.send("fail");
    }
    plan.notify_url_count += 1;
    if (plan.notify_url_count >= 2) {
      plan.pay_finish = true;
      updateExpireNotifyByPlan(plan, function (err) {
        err && console.log("更新到期提醒计划失败", err, plan.user)
      })
    }
    plan.save(function (err) {
      if (err) {
        console.log("easy_pay err", err);
        return res.send("fail");
      }
      return res.send('success');
    })
  })
}

exports.create_partner_trade_by_buyer_notify = function (req, res) {
  alipay.create_partner_trade_by_buyer_notify(req, res);
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
      err = err || new Error( res.__("找不到订单号: %s", out_trade_no))
      console.log(err);
      req.flash("errors", { msg: res.__("找不到订单,请联系管理员")});
      return res.redirect( req.baseUrl )
    }

    plan.pay_obj.pay_to_alipay = req.query;
    plan.status.push('等待用户确认收货')
    plan.pay_finish = true;
    updateExpireNotifyByPlan(plan, function (err) {
      err && console.log("更新到期提醒计划失败", err, plan.user)
    });
    var trade_no = req.query.trade_no;
    var data = {
       trade_no: trade_no
      ,logistics_name: "好多广告网自动发货部"
      ,invoice_no: plan._id
      ,transport_type: "EXPRESS"
     };
    alipay.send_goods_confirm_by_platform(data);
    plan.save(function (err) {
      if (err) {
        console.log(err);
        req.flash('errors', { msg: res.__("订单更新失败, 请联系管理员")})
        return res.redirect( req.baseUrl )
      }
      req.flash('success', { msg: res.__("支付宝已经收到你的付款了")})
      res.locals.plan = plan;
      res.redirect( req.baseUrl );
    })
  })
}

// cb(err) if user never pay, return err, else return null
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
    });

    var now = new Date();
    for (plan of plans) {
      if (plan.pay_finish && plan.expireAt.getTime() > now.getTime()) {
        cb(null);
        break;
      }
    }
    cb(new Error("没有找到购买记录,请联系管理员"));
  });
}


// 发送一封要到期的邮件通知给用户...用户自测(so, 强制发送, 不管是否要到期)
// 且发送完也不设为已发送
exports.send_expire_notify_for_test = function (req, res, next) {
  var user = req.user._id;
  // 找到他的转发地址
  ExpireNotifyAddress.findAddressByUser(user, function (err, notifyAddress) {
    if (err) {
      console.log(err);
    }
    if (err || notifyAddress == null || (notifyAddress.email || "").length < 3) {
      req.flash('errors', { msg: "没有找到通知邮件地址, 点更新来保存下"});
      return res.redirect( req.baseUrl );
    }

    var errHandler = function (err) {
      if (err) {
        console.log(err);
      }
      req.flash('errors', { msg: "发送邮件失败, 请联系管理员, 谢谢"});
      return res.redirect( req.baseUrl );
    }
    // 发送通知邮件
    sendExpireNotifyTo([notifyAddress], errHandler, function (sendExpireNotifySuccessAddresses) {
      console.log('call sendExpireNotifyTo success');
      req.flash('success', { msg: "发送到期提醒邮件成功, 请及时查收, 谢谢"});
      return res.redirect( req.baseUrl );
    });
  });
}

// 发邮件通知用户, 您的会员明天到
// 策略, 利用 crontab 每天 10 点, 自动访问表中有登记域名且快要到期的用户
// 通知他们, 他们的会员, 明天将会到期
//
exports.tomorry_expire = function(req, res, next) {
  // 找到后天将要过期的会员
  // 找到有登记域名的, 并且通过域名登记的 cname mx 双记录
  // 然后根据域名找用户
  // 接着查找该用户的最后到期日期
  // 假设到期日期为 x
  // 如果 今天 now - x  == 2 days 且, 该计划还未发过到期邮件, 那么发到期邮件给用户
  var errHandler = function (err) {
    if (err) {
      console.log(err);
    }
    res.send("failure");
  }
  // 找到近期要过期的会员
  ExpireNotifyAddress.findRecentlyExpireNotifyAddress(errHandler, function (recentlyExpireNotifyAddresses) {
    // 发送通知邮件
    sendExpireNotifyTo(recentlyExpireNotifyAddresses, errHandler, function (sendExpireNotifySuccessAddresses) {
      console.log('call sendExpireNotifyTo success');
      // 将通知状态设为已通知
      setExpireNotifyTrue(sendExpireNotifySuccessAddresses, errHandler, function (results) {
        res.send("success");
      });
    });
    // 过滤掉没有域名绑定的会员, 为什么要过滤, 不要过滤
    // filterAddressByDomainVerify(recentlyExpireNotifyAddresses, errHandler, function (filterAddresses) {
    // })
  });
}


// function filterAddressByDomainVerify(addresses, errCB, successCB) {
//   // 确保这些用户都有域名绑定成功, 没有绑定域名的无视他们
//   var users = addresses.map(function (address) {
//     return address.user;
//   });
//   var match = {
//     $match: {
//       user: {
//         $in: users
//       },
//       cnameVerifyStatus: true,
//       mxVerifyStatus: true,
//     }
//   };
//   var group = {
//     $group: {
//       _id: "$user",
//     }
//   };
//   var aggregate = [
//       match
//     , group
//   ]
//   Domain.aggregate(aggregate, function (err, results) {
//     if (results == null) {
//       err = err || new Error(addresses, "can't get match domain verify")
//     }
//     err && errCB(err);
//     if (results) {
//       var addresses_filterby_domain_verify = results.map(function (obj) {
//         for(address of addresses) {
//           if (obj._id.equals(address.user)) {
//             return address
//           }
//         }
//       });
//       successCB(addresses_filterby_domain_verify);
//     }
//   });
// }

function sendExpireNotifyTo(addresses, errCB, successCB) {
  var debug = false;
  // debug = true;
  if (debug) {
    addresses.forEach(function (notifyAddress) {
      console.log(notifyAddress.email);
    });
    return errCB(new Error("debug mode"))
  }
  var success_list = [];
  var err_list = [];
  async.each(addresses, function (address, done) {
    // done: (err, sendSuccessAddress, sendFailAddress)
    // 如果这个记录没有通过验证, 那么需要发送验证邮件
    var mailOptions = {
      to: address.email,
      from: secrets.expireNotifyEmailSender,
      subject: '你的会员计划快要过期了',
      text: '你在SoManyAd的会员计划快要过期了, 续期请进入 http://somanyad.com/members \n' +
            '谢谢您的支持'
    };
    sendMail(mailOptions, function(err) {
      if (err) {
        console.log(err);
        err = new Error("发送邮件失败, 请联系管理员")
        err_list.push(address);
        done(null); // 不能干扰其他callback 的执行
      } else {
        success_list.push(address);
        done(null); // 不能干扰其他 callback 的执行
      }
    });
  }, function (err) {
    if (err_list.length > 0) {
      return errCB(err_list);
    }
    return successCB(success_list);
  });
}

function setExpireNotifyTrue(addresses, errCB, successCB) {
  var ids = addresses.map(function (address) {
    return address._id;
  })
  ExpireNotifyAddress.makeHadNotifys(ids, function (err, results) {
    err && errCB(err)
    results && successCB(results)
  })
}
