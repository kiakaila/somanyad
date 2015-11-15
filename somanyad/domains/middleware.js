var async = require('async');
var Domain = require("../models/Domain").Domain;
var Emails = require("../emails");
var ForwardRecords = require("../models/ForwardRecord").ForwardRecords;


// 确保用户拥有某个域名
// 要求, 经过 locals_domains 中间件
exports.userOwnerDomain = function (req, res, next) {

  var domain_str = req.query.domain || req.body.domain;
  if (domain_str != null) {
    var domains = res.locals.domains;
    for (domainIdx in domains) {
      var domain = domains[domainIdx];
      if (domain.domain == domain_str) {
        res.locals.domain = domain;
        return next();
      }
    }
  }

  return next(new Error("please input domain name!"));
}

exports.locals_domains = function (req, res, next) {

  if (req.user == undefined) {
    return next();
  }

  res.locals.title = "Domains"

  async.parallel([
    function (done) {
      Emails.findAllVerifyStatus(req.user._id, function (err, emailVs) {
        done(err, emailVs)
      });
    },
    function (done) {
      Domain.find({user: req.user._id}, function (err, domains) {
        done(err, domains);
      });
    }
  ], function (err, results) {
    if (err) {
      req.flash('errors', { msg: err.message });
    }
    var emailVs = results[0];
    var domains = results[1];

    for (domainIdx in domains) {
      for (emailVIdx in emailVs) {
        var domain = domains[domainIdx];
        var emailV = emailVs[emailVIdx];
        if (domain.forward_email_is(emailV)) {
          domain.email = emailV.email
          domain.email_hadVerify = emailV.passVerify;
        }
      }
    }
    res.locals.domains = domains || []
    next();
  })
}
