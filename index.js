// connect to database
require("./db");

exports.emailForward = require("./controllers/forward/emailforward").forward;
