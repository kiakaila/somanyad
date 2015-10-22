
var exec = require('child_process').exec;
var cmd = "swaks -f youremail@yourdomain.com -t aa@jsomanyad.com -s localhost";

exports.sendMail = function(opt, cb) {
  var subject = opt.subject;
  var text = opt.text;
  var from = opt.from;
  var to = opt.to;
  var cmd = "swaks " +
            " -f " + from +
            " -t " + to +
            " --header 'Subject: " + subject + "' " +
            " --body '" + text + "' " +
            " -s localhost ";
  exec(cmd, function (err, stdout, stderr) {
    cb(err);
  });
}
