var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
var stampIt = require("mongoose-stamp");
var findOrCreate = require("mongoose-findorcreate")
var moment = require("moment");

// 转发记录 --  用于显示用户最近两周的转发情况, 让用户能够掌控转发情况, 更放心
//
var forwardRecordSchema = new Schema({

    user: ObjectId,
    // 发件人是谁
    from: {
      user: String,
      host: String
    },
    // 发到哪里
    to: {
      user: String,
      host: String
    },
    // 转发给谁
    forward: String
});
// 转发日期
forwardRecordSchema.plugin(stampIt);

try {
  module.exports.ForwardRecords = mongoose.model("ForwardRecord");
} catch (err) {
  module.exports.ForwardRecords = mongoose.model("ForwardRecord", forwardRecordSchema);
}
