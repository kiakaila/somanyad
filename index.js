// connect to database
require("./db");

exports.Domain = require("./models/Domain").Domain;
exports.Forward = require("./models/Domain").Forward;
exports.ForwardRecords = require("./models/ForwardRecord").ForwardRecords;
exports.BlackReceiveList = require("./models/Domain").BlackReceiveList;
exports.EmailVerify = require("./models/Domain").EmailVerify;
exports.feePlan = require("./members/models").feePlan;
exports.secrets = require("./config/secrets");
