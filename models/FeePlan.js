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

  pay_obj: Schema.Types.Mixed,

  // 是否已经付款, 可能要先跳转到支付宝, 然后在跳转回来
  pay_finish: { type: Boolean, default: false }
});
feePlanSchema.plugin(findOrCreate);


try {
  module.exports.feePlan = mongoose.model("feePlan");
} catch (err) {
  module.exports.feePlan = mongoose.model("feePlan", feePlanSchema);
}
