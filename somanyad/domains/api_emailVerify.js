
var Domain = require("../../models/Domain").Domain;
var Forward = require("../../models/Domain").Forward;
var EmailVerify = require("../../models/Domain").EmailVerify;
var SendEmailVerify = require("../../models/Domain").SendEmailVerify;

var dnslookup = require("../../lib/dnslookup");
var settings = require("../../config/secrets")

exports.addForwardEmail = function (req, res) {
  var email = req.query.email;
  var uid = req.user._id;

  // 发送授权邮件到 email
  SendEmailVerify.findOrCreate({email: email, user: uid}, function (err, sendEmail) {

    if (err || sendEmail == null) {
      return res.send({
        status: "Failure",
        message: (err || new Error("can't create email record! Please contact adminster")).message
      });
    }

    sendEmail( req.baseUrl + "/emailVerify?key=" + sendEmail.id + "&email=" + email, function (err) {
      if (err) {
        return res.send({
          status: "Failure",
          message: err.message
        })
      }

      return res.send({
        status: "OK"
      })
    })
  })
}

// 验证邮件地址
exports.emailVerify = function (req, res) {
  var key = req.query.key;
  var email = req.query.email;
  // 从 key 中解析出 uid, 和 email
  EmailVerify.find({_id: key}, function (err, sendEmail) {
    if (err || sendEmail == null || sendEmail.email != email) {
      return res.send({
        status: "Failure",
        message: (err || new Error("verify record not found!")).message
      })
    }

    EmailVerify.findOrCreate({email: email, user: sendEmail.user}, function (err, emailV) {
      if (err || emailV == null) {
        return res.send({
          status: "Failure",
          message: (err || new Error("create verify record field!")).message
        })
      }

      sendEmail.remove();
      return res.send({
        status: "OK"
      })
    })
  })
}

exports.emailVerifyList = function (req, res) {
  var uid = req.user._id;
  EmailVerify.find({user: uid}, function (err, emails) {
    if (err || emails == null) {
      return res.send({
        status: "Failure",
        message: (err || new Error("not emails")).message
      })
    }

    return res.send({
      status: "OK",
      emails: emails
    })
  })
}

exports.removeEmailVerify = function (req, res) {
  var email = req.query.email;
  var uid = req.user._id;
  EmailVerify.remove({email: email, user: uid}, function (err, email) {
    if (err || email == null) {
      return res.send({
        status: "Failure",
        message: (err || new Error("email not found!")).message
      })
    }

    return res.send({
      status: "OK"
    })
  })
}
