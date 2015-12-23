var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate");


// 判断是否允许某个用户把邮件转发到某个指定邮箱
var errorUrlSchema = new mongoose.Schema({
    content: String
  , url: String
});

errorUrlSchema.plugin(stampIt);
errorUrlSchema.plugin(findOrCreate);


var ErrorUrl = mongoose.model("errorUrlSchema", errorUrlSchema);

exports.hadRegisterEmailAddress = function (email, cb) {
  var q = {email: email};
  EmailVerify.findOne(q, function(err, emailV) {
    if (emailV) {
      return cb(null, email);
    };
    return cb(err || new Error("Email address not found"), null);
  });
}
// err, cb(url)
exports.findErrorUrl = function (err, cb) {
  var q = {content: err.message}
  ErrorUrl.findOrCreate(q, function (err, errUrl) {
    if (err || errUrl == null) {
      return cb(err.message);
    }
    return cb("http://somanyad.com/members/errurl/" + errurl._id);
  });
}

exports.errorHandler = function (req, res) {
  var id = req.params.id;
  var q = {_id: ObjectId(id)}
  ErrorUrl.findOne(q, function (err, errUrl) {
    if (err || errUrl == null) {
      err = err || new Error("找不到记录");
      return res.send(err);
    }
    return res.send(errUrl.content);
  });
}
