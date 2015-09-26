
var Domain = require("../../models/Domain").Domain;
var Forward = require("../../models/Domain").Forward;
var EmailVerified = require("../../models/Domain").EmailVerified;
var SendEmailVerify = require("../../models/Domain").SendEmailVerify;

var dnslookup = require("../../lib/dnslookup");
var settings = require("../../config/secrets")

// 将域名 与 转发邮件地址绑定
exports.selectForwardEmail = function (req, res) {
  var uid = req.user._id;
  var email = req.query.email;
  var domain = req.query.domain;

  // 1. 找到 email 记录
  // 2. 找到 domain 记录
  // 3. 更新 domain 记录
  EmailVerified.find({email: email, user: uid}, function (err, emailV) {
    if (err || emailV == null) {
      return res.send({
        status: "Failure",
        message: (err || new Error("forward email not found!")).message
      })
    }
  })
}

exports.cnameVerifyStatus = function (req, res) {
  var domain = req.query.domain;
  dnslookup.domainVerify(domain, req.user._id, function (err) {
    if (err) {
      return res.send("Failure");
    }
    return res.send("Ok");
  });
}
exports.mxVerifyStatus = function (req, res) {
  var domain = req.query.domain;
  dnslookup.mxVerify(domain, settings.mailServers, function (err) {
    if (err) {
      return res.send(err.message);
    }
    return res.send("OK");
  });
}
