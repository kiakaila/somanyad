var dnslookup = require("../../lib/dnslookup");
var settings = require("../../somanyad/config")

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
