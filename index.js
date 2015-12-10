// connect to database
require("./db");


exports.Domain = require("./somanyad/models/Domain").Domain;
exports.Forward = require("./somanyad/models/Domain").Forward;
exports.ForwardRecords = require("./somanyad/models/ForwardRecord").ForwardRecords;
exports.BlackReceiveList = require("./somanyad/models/Domain").BlackReceiveList;
exports.getPassVerifyAndAddressById = require("./somanyad/emails").getPassVerifyAndAddressById;
exports.hadRegisterEmailAddress = require("./somanyad/emails").hadRegisterEmailAddress;
exports.user_had_pay = require("./somanyad/members/members").user_had_pay;
exports.secrets = require("./somanyad/config");
