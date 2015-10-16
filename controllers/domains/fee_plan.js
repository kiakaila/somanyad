var ForwardRecords = require("../../models/Domain").ForwardRecords;

exports.used = function (req, res) {
  var domain = req.query.domain;
  var m = (new Date()).getMonth() + 1
  var startAt = req.query.startAt ||
  ForwardRecords.find({domain: domain, user: req.user._id}, function (err, count) {

    return res.send({
      domain: domain,
      count: count,
      err: err
    });
  });
}
