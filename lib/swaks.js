
var exec = require('child_process').exec;
var cmd = "swaks -f youremail@yourdomain.com -t aa@jsomanyad.com -s localhost";

exports.sendMail = function(opt, cb) {
  var subject = new Buffer(opt.subject).toString('base64');
  subject = "=?UTF-8?B?" + subject + "?=";
  var text = opt.text;
  var from = opt.from;
  var to = opt.to;
  var cmd = "swaks " +
            " -f " + from +
            " -t " + to +
            " --header 'Subject: " + subject + "' " +
            " --body '" + text + "' " +
            " -s localhost ";
  // console.log(cmd);  // 不要打印, 会导致 pm2 重启的...
  exec(cmd, function (err, stdout, stderr) {
    cb(err);
  });
}
