var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

var liuliangbao = {
  "qingtong": 3000, // 青铜流量包
  "baijin": 3000, // 白金流量包
  "huangjin": 3000 * 10, // 黄金流量包
  "chaoji": 3000 * 100 // 超级流量包
}
var userObj = {
  // 用户id
  user: ObjectId
}
var planObj = {
  // 青铜流量包(qingtong), 白金流量包(baijin), 黄金流量包(huangjin), 超级流量包(chaoji)
  feeType: String,
  // 开始于
  startAt: { type: Date, default: Date.now },
  // 到期于
  expireAt: Date
}
var forwardCountObj = {
  // 已使用转发数
  usedForwardCount: { type:Number, default: 0},
  // 总可以转发数
  totalForwardCount: Number
}
var payObj = {
  // 付费id
  pay_id: String,
  // 付费类型 如 alipay, paypal
  pay_type: String,
  // 用户付费日期
  pay_date: { type: Date, default: Date.now },
  // 付了多少钱
  pay_money: String,
  // 购买流量包个数(月)
  pay_count: Number,
  // 是否已经付款, 可能要先跳转到支付宝, 然后在跳转回来
  pay_finish: { type: Boolean, default: false }
}
var freeObj = _.extend({}, userObj, planObj, forwardCountObj);
var feeObj = _.extend({}, freeObj, payObj);

var freeFeePlanSchema = new Schema(freeObj);    // 免费流量包
var feePlanSchema = new Schema(feeObj);   // 付费流量包, 为流量包累计
freeFeePlanSchema.plugin(findOrCreate);
feePlanSchema.plugin(findOrCreate);

freeFeePlanSchema.pre("save", function (next) {
  if (!this.feeType) {
    this.feeType = "qingtong";
  }

  if (!this.totalForwardCount) {
    this.totalForwardCount = liuliangbao[this.feeType];
  }

  return next();
})
feePlanSchema.pre("save", function (next) {
  if (!this.totalForwardCount) {
    this.totalForwardCount = liuliangbao[this.feeType];
  }

  return next();
})
// 免费流量包
module.exports.freeFeePlan = mongoose.model("freeFeePlan", freeFeePlanSchema);
// 付费流量包
module.exports.feePlan = mongoose.model("feePlan", feePlanSchema);
