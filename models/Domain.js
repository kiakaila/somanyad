var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var createdModifiedPlugin = require("mongoose-createdmodified").createdModifiedPlugin;
var findOrCreate = require("mongoose-findorcreate")

// 判断是否允许某个用户把邮件转发到某个指定邮箱
var emailVerifySchema = new mongoose.Schema({
    user: ObjectId
  , email: String
  // 用户是否已经点击验证链接
  // 用户希望转发到某个邮箱时, 会发送一封邮件到这个邮箱
  // 用户需要点击里面的链接, 来说明这个邮箱愿意接收转发
  // 链接里面的key 由 email, id 两个字段组成
  , passVerify: { type: Boolean, default: false }
});

emailVerifySchema.plugin(createdModifiedPlugin);
emailVerifySchema.plugin(findOrCreate);

emailVerifySchema.methods.SendVerifyEmail = function (cb) {
  var err = new Error("send email failure!");
  cb(err)
}

// 域名是否属于某个用户, 且是否激活
var domainSchema = new mongoose.Schema({
    domain 	: { type: String, index: { unique: true, dropDups: true} }
    // 用户是否拥有这个域名
    // 通过cname 别名判断用户是否拥有这个域名
    // 当用户cname 别名通过时, 会把这个字段cnameVerifyStatus 设置成 true
  , cnameVerifyStatus  : { type: Boolean, default: false }
    // 用户mx 记录是否设置正确
  , mxVerifyStatus: { type: Boolean, default: false}
  , user 		: ObjectId
  // 转发策略
  , forward_type: { type: String, default: "白名单" }
  // 转发邮箱 emailVerifySchema
  , forward_email: ObjectId
})

domainSchema.plugin(findOrCreate);
domainSchema.plugin(createdModifiedPlugin, {index: true});

domainSchema.methods.forward_email_is = function (emailV) {
  if (this.forward_email && emailV && this.forward_email.equals(emailV._id)) {
    return true;
  }
  return false;
}

domainSchema.pre("save", function (next) {
  if (this.domain.length < 3) {
    return next(new Error("不是正确的域名, 域名长度不对"));
  }
  next();
})

// 作废地址 -- 凡是发到作废地址的, 直接退回
var blackReceiveListSchema = new Schema({
    user: ObjectId,

    domain: ObjectId,
    // blockAddress + @ + `find domain by domainId` ==> email address
    blockAddress: String,
    replyInfo: String
})
blackReceiveListSchema.plugin(findOrCreate);

// 转发记录 --  用于统计用户额度
var forwardRecordSchema = new Schema({
    user: ObjectId,
    // 发件人是谁
    from: String,
    // 收件域名
    domain: String,
    // 收件地址栏
    toUser: String
});
// 转发日期
forwardRecordSchema.plugin(createdModifiedPlugin, {index: true});
// 用户付费情况
var feePlanSchema = new Schema({
  user: ObjectId,
  // 用户付费日期
  startAt: { type: Date, default: Date.now },
  // 用户剩余会员月份
  count: Number
})
// 用户的付费记录, 譬如什么时候, 付了多少钱
var feePlanRecordSchema = new Schema({
  user: ObjectId,
  // 什么时候
  pay_date:  { type: Date, default: Date.now },
  // 付了多少钱
  money: Number,
  // 购买会员月数
  count: Number,
  // 付费id
  pay_id: String,
  // 付费类型
  pay_type: String
})

module.exports.EmailVerify = mongoose.model("EmailVerifyq", emailVerifySchema);
module.exports.Domain = mongoose.model('Domain', domainSchema);
module.exports.BlackReceiveList = mongoose.model("BlackList", blackReceiveListSchema);
module.exports.ForwardRecords = mongoose.model("ForwardRecord", forwardRecordSchema);
