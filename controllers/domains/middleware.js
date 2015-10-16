var async = require('async');
var Domain = require("../../models/Domain").Domain;
var EmailVerify = require("../../models/Domain").EmailVerify;
var ForwardRecords = require("../../models/Domain").ForwardRecords;
var getAvailableCount = require('../members/members').getAvailableCount; // 获取当期可用流量


// 确保用户拥有某个域名
// 要求, 经过 locals_domains 中间件
exports.userOwnerDomain = function (req, res, next) {

  var domainStr = req.query.domain || req.body.domain;
  if (domainStr != null) {
    var domains = res.locals.domains;
    for (domainIdx in domains) {
      var domain = domains[domainIdx];
      if (domain.domain == domainStr) {
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
      EmailVerify.find({user: req.user._id}, function (err, emailVs) {
        done(err, emailVs);
      });
    },
    function (done) {
      Domain.find({user: req.user._id}, function (err, domains) {
        done(err, domains);
      });
    },
    // 查询转发数, 总转发数, 单个域名转发数
    function (done) {
      ForwardRecords.fn_totalsForwardCount(req.user._id, function (err, totalForwardCount, eachDomains) {
        done(err, [totalForwardCount, eachDomains]);
      });
    },
    // 查询可用转发数
    function (done) {
      getAvailableCount(req.user._id, function (count) {
        done(null, count || 0);
      });
    }
  ], function (err, results) {
    if (err) {
      req.flash('errors', { msg: err.message });
    }
    var emailVs = results[0];
    var domains = results[1];
    var eachDomains = results[2][1];
    var nowCanUseCount = results[3];

    for (domainIdx in domains) {
      for (emailVIdx in emailVs) {
        var domain = domains[domainIdx];
        var emailV = emailVs[emailVIdx];
        if (domain.forward_email_is(emailV)) {
          domain.email = emailV.email
          domain.email_hadVerify = emailV.passVerify;
        }

        domain.forwardCount = 0
        for (forwardIdx in eachDomains){
          if (domain.domain == forwardCounts[forwardIdx]._id) {
            domain.forwardCount = forwardCounts[forwardIdx].count || domain.forwardCount;
          }
        }
      }
    }
    res.locals.totalForwardCount = results[2][0];
    res.locals.domains = domains || []
    res.locals.nowCanUseCount = nowCanUseCount;
    next();
  })
}
