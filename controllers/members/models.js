var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");
var stampIt = require("mongoose-stamp");

// 免费计划
var freePlanSchema = new Schema({
  user: ObjectId,
  feeType: { type: String, default: "免费"},
  pay_money: { type: String, default: "0.0"},
  startAt: { type: Date, default: Date.now },
  expireAt: Date,
  duration: { type: String, default: "10天" },
  status: { type: String, default: "订单已生效" },
  pay_finish: { type: Boolean, default: true }
});
freePlanSchema.plugin(stampIt);
// 支付宝付费
var alipayPlanSchema = new Schema({
  user: ObjectId,
  feeType: { type: String, default: "支付宝"},
  startAt: { type: Date, default: Date.now },
  expireAt: Date,
  duration: { type: String, default: "1年" },
  pay_finish: { type: Boolean, default: false },
  // pay_money: type: String,
  trade_no: String,
  notify_url_count: { type: Number, default: 0},
  status: [String], // 等待用户付款, 发货尝试n, 等待用户确认收货, 订单已生效, 发货成功
  pay_obj: {
    register_to_pay: Schema.Types.Mixed,
    notify_from_alipay: Schema.Types.Mixed,
    pay_to_alipay: Schema.Types.Mixed,
    had_send_goods: { type: Number, default: 0 }
  }
})
alipayPlanSchema.virtual("pay_money").get(function () {
  return this.pay_obj.register_to_pay.price;
})
alipayPlanSchema.plugin(stampIt);

module.exports.freePlan = mongoose.model("FreePlan", freePlanSchema);
module.exports.alipayPlan = mongoose.model("AlipayPlan", alipayPlanSchema);
