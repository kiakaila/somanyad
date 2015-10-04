// connect to database
require("./db");

exports.emailForward = require("./controllers/domains/emailforward").forward;
