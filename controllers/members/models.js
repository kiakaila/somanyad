var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

// 免费计划
var freePlanSchema = new Schema({
  user: ObjectId,
  feeType: { type: String, default: "免费"},
  pay_money: { type: String, default: "0.0"},
  startAt: { type: Date, default: Date.now },
  expireAt: Date,
  pay_finish: { type: Boolean, default: true }
});
freePlanSchema.plugin(findOrCreate);
// 支付宝付费
var alipayPlanSchema = new Schema({
  user: ObjectId,
  feeType: { type: String, default: "支付宝"},
  startAt: { type: Date, default: Date.now },
  expireAt: Date,
  pay_finish: { type: Boolean, default: false },
  // pay_money: type: String,
  pay_obj: {
    register_to_pay: Schema.Types.Mixed,
    pay_to_alipay: Schema.Types.Mixed,
    had_send_goods: { type: Boolean, default: false }
  }
})
alipayPlanSchema.virtual("pay_money").get(function () {
  return this.pay_obj.register_to_pay.price;
})

module.exports.freePlan = mongoose.model("FreePlan", freePlanSchema);
module.exports.alipayPlan = mongoose.model("AlipayPlan", alipayPlanSchema);
