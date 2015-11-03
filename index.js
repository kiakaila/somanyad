// connect to database
require("./db");

exports.Domain = require("./models/Domain").Domain;
exports.Forward = require("./models/Domain").Forward;
exports.ForwardRecords = require("./models/ForwardRecord").ForwardRecords;
exports.BlackReceiveList = require("./models/Domain").BlackReceiveList;
exports.EmailVerify = require("./models/Domain").EmailVerify;
exports.user_had_pay = require("./controllers/members/members").user_had_pay;
exports.secrets = require("./config/secrets");
