var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

// 域名是否属于某个用户, 且是否激活
var domainSchema = new mongoose.Schema({
    domain 	: { type: String, index: { unique: true, dropDups: true} }
    // 用户是否拥有这个域名
    // 通过 cname 别名判断用户是否拥有这个域名
    // 当用户 cname 别名通过时, 会把这个字段cnameVerifyStatus 设置成 true
  , cnameVerifyStatus  : { type: Boolean, default: false }
    // 用户mx 记录是否设置正确
  , mxVerifyStatus: { type: Boolean, default: false }
  , user 		: ObjectId
  // 转发邮箱 emailVerifySchema
  , forward_email: ObjectId
});

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

  module.exports.Domain = mongoose.model('Domain');
  module.exports.BlackReceiveList = mongoose.model("BlackList");
} catch (err) {
  module.exports.Domain = mongoose.model('Domain', domainSchema);
  module.exports.BlackReceiveList = mongoose.model("BlackList", blackReceiveListSchema);
}
