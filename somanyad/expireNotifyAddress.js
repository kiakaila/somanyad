var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var _ = require("underscore");
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var moment = require("moment");

var findOrCreate = require("mongoose-findorcreate")
var stampIt = require("mongoose-stamp");


// 用户会员到期前两天,邮件通知 用户 您的会员计划将要到期, 请记得续期
var expireNotifyAddressSchema = new Schema({
  user: ObjectId,
  email: String,
  expireAt: { type: Date, default: Date.now },
  had_notify: { type: Boolean, default: false}
});
expireNotifyAddressSchema.plugin(stampIt);
expireNotifyAddressSchema.plugin(findOrCreate);

var expireNotifyAddress = mongoose.model("ExpireNotifyAddress", expireNotifyAddressSchema);

// 如果是比较旧的日期,就更新提醒计划
// cb(err)
exports.updateExpireTimeIfIsLaterExpireTime = function (expireAt, cb) {
  expireNotifyAddress.findOrCreate({user: plan.user}, function (err, notifyAddress, created) {
    if (err || notifyAddress == null) {
      err = err || new Error("无法创建通知计划")
      return cb(err)
    }
    if (notifyAddress.expireAt.getTime() < plan.expireAt.getTime()) {
      notifyAddress.expireAt = plan.expireAt;
    }
    notifyAddress.had_notify = false;
    notifyAddress.save(function (err) {
      cb(err)
    })
  })
}

// 更新提醒地址, 如果没有就创建一个
// cb(err)
exports.updateNotifyEmail = function (user, email, expireAt, cb) {
  expireNotifyAddress.findOrCreate({user: user}, function (err, notifyAddress, created) {
    if (err || notifyAddress == null) {
      err = err || new Error("无法创建通知计划")
      return cb(err);
    };
    notifyAddress.email = email;
    notifyAddress.expireAt = expireAt;
    notifyAddress.save(function (err) {
      return cb(err);
    });
  });
}

// 根据用户id 找到用户的邮件地址
// cb(err, notifyAddress)
exports.findAddressByUser = function (user, cb) {
  expireNotifyAddress.findOne({user: user}, function (err, notifyAddress) {
    return cb(err, notifyAddress);
  })
}

// 找到近期要过期的通知记录
exports.findRecentlyExpireNotifyAddress = function (errCB, successCB) {

  var now = moment().toDate();
  var after2days = moment().subtract(-2, 'days').toDate();
  var q = {
    expireAt: {
      $gte: now,            // 大于今天
      $lte: after2days    // 小于两天后
    },
    had_notify: false,
  }
  expireNotifyAddress.find(q, function (err, addresses) {
    if (err || addresses.length == 0) {
      return errCB(err);
    }
    return successCB(addresses);
  });
}

// 将一些通知地址(根据id), 设为已通知
// cb(err, results)
exports.makeHadNotifys = function (ids, cb) {
  expireNotifyAddress.update({_id: {$in: ids}}, {$set: {"had_notify": true}}, function (err, results) {
    cb(err, results);
  });
}

// 找到用户的提醒地址
// cb(err, email)
exports.findUserNotifyEmailAddress = function (user, cb) {
  expireNotifyAddress.findOne({user: user}, function (err, notifyAddress) {
    if (notifyAddress == null) {
      err = err || new Error("找不到通知地址, 请先设定")
      return cb(err, "");
    }
    return cb(err, notifyAddress.email);
  })
}
