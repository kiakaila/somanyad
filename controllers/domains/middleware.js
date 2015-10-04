var async = require('async');
var Domain = require("../../models/Domain").Domain;
var EmailVerify = require("../../models/Domain").EmailVerify;

exports.userOwnerDomain = function (req, res, next) {

  var domainStr = req.query.domain || req.body.domain;
  if (domainStr != null) {
    async.waterfall([
      function (done) {
        Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
          if (domain == null) {
            err = new Error("domain not found!")
          }
          res.locals.domain = domain;
          done(err, domain);
        })
      },
      function (domain, done) {
        EmailVerify.findOne({_id: domain.forward_email}, function (err, emailV) {
          domain.email = (emailV || {}).email
          done(err);
        })
      }
    ], function (err) {
      next(err);
    })
  }
}

exports.locals_domains = function (req, res, next) {

  if (req.user == undefined) {
    return next();
  }

  async.series([
    function (done) {
      EmailVerify.find({user: req.user._id}, function (err, emailVs) {
        done(err, emailVs);
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
