
var Domain = require("../../models/Domain").Domain;
var Forward = require("../../models/Domain").Forward;
var EmailVerified = require("../../models/Domain").EmailVerified;
var dnslookup = require("../../lib/dnslookup");
var settings = require("../../config/secrets")

exports.home = function (req, res) {

  Domain.find({user: req.user._id}, function (err, domains) {

    console.log(err, domains, "hello");
    if (err) {

      return res.render('domains/home', {
        title: "Manage Domains",
        active_item: "domains",
        error: err.message,
        domains: domains
      })
    }

    res.render('domains/home', {
      title: "Manage Domains",
      active_item: "domains",
      domains: domains
    })
  })
}

exports.setup = function (req, res) {
  var domain = req.query.domain
  
  res.render("domains/setup", {
    domain: domain
  })
}

exports.emails = function (req, res) {

  res.render("domains/emails", {
    active_item: "emails"
  })
}
exports.emails_forward = function (req, res) {
  var domainStr = req.query.domain;
  Domain.findOne({domain: domainStr, user: req.user._id}, function (err, domain) {
    if (err) {
      return res.send(err);
    }
    if (domain) {

    }
  })
}

exports.forward = function (req, res) {
  res.render("domains/forward", {
    active_item: "forward"
  })
}


exports.tongji = function (req, res) {
  res.render("domains/tongji", {
    active_item: "tongji"
  })
}

exports.addNewDomain = function (req, res) {
  res.render("domains/addNewDomain", {
    active_item: "domains"
  })
}
exports.addNewDomain_post = function (req, res) {
  var domain = req.body.domain;
  var user = req.user;
  console.log(req.body);
  Domain.findOrCreate({domain: domain, user: user._id}, function (err, domain) {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.redirect('/domains/addNewDomain');
    }
    if (domain == null) {
      req.flash("errors", { msg: "create domain failure, please contact adminer!"})
      return res.redirect("/domains/addNewDomain");
    }

    console.log(domain);
    return res.redirect("/domains/newDomainSetup?domain=" + domain.domain)
  })
}

exports.newDomainSetup = function (req, res) {
  var domain = req.query.domain;
  var cname = dnslookup.cnameFun(domain, req.user._id);
  var mailServers = settings.mailServers

  return res.render("domains/newDomainSetup", {
    domain: domain,
    cname: cname,
    mailServers: mailServers,
    cnamePointTo: settings.cnamePointTo
  });
}


//
exports.setupForwardTo = function (req, res) {
  var domainStr = req.query.domain;

  Domain.findOne({domain: domainStr}, function (err, domain) {
    if (err) {
      return res.render("domains/setupForwardTo", {
        domain: domainStr,
        error: err.message
      });
    }

    EmailVerified.find({user: req.user._id}, function (err, emails) {
      if (err) {
        console.log(err);
        return res.render("domains/setupForwardTo", {
          domain: domainStr,
          emails: []
        });
      }

      return res.render("domains/setupForwardTo", {
        domain: domainStr,
        emails: emails
      });
    })
  })
}
