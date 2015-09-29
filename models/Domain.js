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

domainSchema.pre("save", function (next) {
  if (this.domain.length < 3) {
    return next(new Error("不是正确的域名, 域名长度不对"));
  }
  next();
})
// 白名单机制
// 只有白名单里的邮件地址, 才允许转发

var whiteListSchema = new Schema({
    domain: ObjectId
  , allowUser: String
    // 该user 地址是否处于激活状态,
		// 如果处于非激活状态, 则该地址收到的邮件自动拒绝
  , active: { type: Boolean, default: true }
})

// 黑名单机制
// 凡是不在黑名单里的邮件地址, 都转发
var blackListSchema = new Schema({
    domain: ObjectId
  , blockUser: String
})

module.exports.EmailVerified = mongoose.model("EmailVerified", emailVerifySchema);
module.exports.Domain = mongoose.model('Domain', domainSchema);
module.exports.WhiteList = mongoose.model("WhiteList", whiteListSchema);
module.exports.BlackList = mongoose.model("BlackList", blackListSchema);
