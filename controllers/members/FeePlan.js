var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

// 付费记录
var feePlanSchema = new Schema({
  // 用户 id
  user: ObjectId,
  // 付费类型: 免费, 付费
  feeType: String,
  // 开始于
  startAt: { type: Date, default: Date.now },
  // 到期于
  expireAt: Date,

  // 付费id
  pay_id: String,
  // 付费类型 如 alipay, paypal
  pay_type: String,
  // 用户付费日期
  pay_date: { type: Date, default: Date.now },
  // 付了多少钱
  pay_money: { type: String, default: "0" },
  // 是否已经付款, 可能要先跳转到支付宝, 然后在跳转回来
  pay_finish: { type: Boolean, default: false }
});
feePlanSchema.plugin(findOrCreate);

// 付费计划
module.exports.feePlan = mongoose.model("feePlan", feePlanSchema);
