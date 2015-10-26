var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

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

emailVerifySchema.plugin(stampIt);
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
  , mxVerifyStatus: { type: Boolean, default: false }
  , user 		: ObjectId
  // 转发邮箱 emailVerifySchema
  , forward_email: ObjectId
})

domainSchema.plugin(findOrCreate);
domainSchema.plugin(stampIt);

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


try {
  module.exports.EmailVerify = mongoose.model("EmailVerifyq");
  module.exports.Domain = mongoose.model('Domain');
  module.exports.BlackReceiveList = mongoose.model("BlackList");
} catch (err) {
  module.exports.EmailVerify = mongoose.model("EmailVerifyq", emailVerifySchema);
  module.exports.Domain = mongoose.model('Domain', domainSchema);
  module.exports.BlackReceiveList = mongoose.model("BlackList", blackReceiveListSchema);
}
