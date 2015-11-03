// connect to database
require("./db");

exports.Domain = require("./models/Domain").Domain;
exports.Forward = require("./models/Domain").Forward;
exports.ForwardRecords = require("./models/ForwardRecord").ForwardRecords;
exports.BlackReceiveList = require("./models/Domain").BlackReceiveList;
exports.EmailVerify = require("./models/Domain").EmailVerify;
exports.freePlan = require("./controllers/members/models").freePlan;
exports.alipayPlan = require("./controllers/members/models").alipayPlan;
exports.secrets = require("./config/secrets");
