var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate");
var secrets = require("../somanyad/config");
var sendMail = require('../lib/swaks').sendMail;

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


var EmailVerify = mongoose.model("EmailVerifyq", emailVerifySchema);

exports.hadRegisterEmailAddress = function (email, cb) {
  var q = {email: email};
  EmailVerify.findOne(q, function(err, emailV) {
    if (emailV) {
      return cb(null, email);
    };
    return cb(err || new Error("Email address not found"), null);
  });
}
// 用户是否点击了验证邮件, 如果用户还没有这个记录, 那么就创建
// cb(err, is_verified, emailVID)
exports.is_verified_address = function (uid, email, cb) {
  var q = {user: uid, email: email};
  EmailVerify.findOrCreate(q, function (err, emailV) {
    cb(err, emailV.passVerify, emailV._id);
  });
}

// 再次发送验证邮件
// cb(err)
var send_verify_email = exports.send_verify_email = function (nickname, emailVID, __, cb) {
  if (cb == null) {
    cb = __;
    __ = function (text) {
      for (var i = 1; i < arguments.length; i++) {
        text = text.replace("%s", arguments[i])
      }
      return text;
    }
  };
  var q = {_id: emailVID};
  EmailVerify.findOne(q, function (err, emailV) {
    if (err || emailV == null) {
      err = err || new Error(__("找不到验证记录"));
      return cb(err);
    };
    // 如果这个记录没有通过验证, 那么需要发送验证邮件
    var text = "你是否允许用户: %s 转发邮件给你, 如果允许请点击下面的链接, 或者将下面的链接复制到浏览器地址栏\n\n %s?id=%s&email=%s\n\n如果不允许,则无需进行操作.\n";
    text = __(text, nickname, secrets.verifyEmailLinkPre, emailVID, emailV.email);
    var mailOptions = {
      to: emailV.email,
      from: secrets.verifyEmailSender,
      subject: __('验证邮箱所有权'),
      text: text
    };
    sendMail(mailOptions, function(err) {
      if (err) {
        console.log(err);
        err = new Error(__("发送邮件失败, 请联系管理员"))
        return cb(err);
      }
      cb(null);
    });
  })
}

// 根据 emailVID 获取对应的地址
// cb(err, email_address)
exports.getEmailAddressById = function (emailVID, __, cb) {
  if (cb == null) {
    cb = __;
    __ = function (text) {
      for (var i = 1; i < arguments.length; i++) {
        text = text.replace("%s", arguments[i])
      }
      return text;
    }
  };
  var q = {_id: emailVID};
  EmailVerify.findOne(q, function (err, emailV) {
    if (emailV == null) {
      err = err || new Error(__("找不到邮件地址"))
      return cb(err, null);
    };
    cb(null, emailV.email);
  });
}

// 根据emailVID 获取是否通过验证, 邮件地址
// cb(err, is_verified, email)
exports.getPassVerifyAndAddressById = function (emailVID, __, cb) {
  if (cb == null) {
    cb = __;
    __ = function (text) {
      for (var i = 1; i < arguments.length; i++) {
        text = text.replace("%s", arguments[i])
      }
      return text;
    }
  };
  var q = {_id: emailVID};
  EmailVerify.findOne(q, function (err, emailV) {
    if (emailV == null) {
      err = err || new Error(__("找不到邮件地址"))
      return cb(err, false, "")
    };
    cb(null, emailV.passVerify, emailV.email);
  });
}


// 找到邮箱地址, 如果没有通过验证, 则发送验证邮件
// cb(err, email, passVerify)
exports.sendVerifyEmailIfNeed = function (nickname, emailVID, __, cb) {
  if (cb == null) {
    cb = __;
    __ = function (text) {
      for (var i = 1; i < arguments.length; i++) {
        text = text.replace("%s", arguments[i])
      }
      return text
    }
  }
  EmailVerify.findOne({_id: emailVID}, function (err, emailV) {
    if (emailV == null || err) {
      err = err || new Error(__("找不到验证邮件"))
      return cb(err, "", false);
    }
    if (emailV.passVerify) {
      return cb(null, emailV.email, true)
    }
    send_verify_email(nickname, emailVID, __, function (err) {
      return cb(err, emailV.email, false)
    });
  })
}

// 验证邮件地址
// cb(err, passVerify)
exports.verifyAddress = function (emailVID, email, __, cb) {
  if (cb == null) {
    cb = __;
    __ = function (text) {
      for (var i = 1; i < arguments.length; i++) {
        text = text.replace("%s", arguments[i])
      }
      return text;
    };
  };
  EmailVerify.findOne({_id: emailVID, email: email}, function (err, emailV) {
    if (emailV == null || err) {
      err = err || new Error( __("找不到邮件记录: email:" + email + "id: " + emailVID) )
      return cb(err, false);
    };
    emailV.passVerify = true;
    emailV.save(function (err) {
      if (err) {
        return cb(err, false);
      };
      return cb(null, true);
    });
  });
}

// 查找之前的转发记录, 或者创建新的
// 发送验证邮箱所有权的邮件
// cb(err, emailVID, passVerify)
exports.sendNewVerifyEmailIfNeed = function(uid, nickname, email, __, cb) {
  var q = {user: uid, email: email}
  EmailVerify.findOrCreate(q, function (err, emailV) {
    if (err) {
      return cb(err, null, false);
    }
    if (emailV.passVerify) {
      return cb(null, emailV._id, true)
    }
    send_verify_email(nickname, emailV._id, __, function (err) {
      return cb(err, emailV._id, false);
    });
  });
}

// 找到某个用户的所有验证邮件记录
// cb(err, emailVs)
exports.findAllVerifyStatus = function (uid, cb) {
  EmailVerify.find({user: uid}, function (err, emailVs) {
    cb(err, emailVs);
  })
}
