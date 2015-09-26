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
});

emailVerifySchema.plugin(createdModifiedPlugin);

var sendEmailVerifySchema = new mongoose.Schema({
    user: ObjectId
  , email: String
});
sendEmailVerifySchema.plugin(createdModifiedPlugin)

// 域名是否属于某个用户, 且是否激活
var domainSchema = new mongoose.Schema({
    domain 	: { type: String, index: { unique: true, dropDups: true} }
  , active  : { type: Boolean, default: false }
  , user 		: ObjectId
  , date 		: { type: Date, default: Date.now }
  , forward_type: { type: String, default: "白名单" }
  , forward_email: ObjectId
})

domainSchema.plugin(findOrCreate);
domainSchema.plugin(createdModifiedPlugin, {index: true});

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
module.exports.SendEmailVerify = mongoose.model("SendEmailVerify", sendEmailVerifySchema);
