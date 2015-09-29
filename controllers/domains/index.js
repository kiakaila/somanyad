
var emailVerify = require("./api_emailVerify");
var domains = require("./domains");
var domains_api = require("./api_domains");
var router = require("express").Router();
var Domain = require("../../models/Domain").Domain;
var EmailVerified = require("../../models/Domain").EmailVerified;
var async = require("async");

function locals_domains (req, res, next) {

  async.series([
    function (done) {
      EmailVerified.find({user: req.user._id}, function (err, emailVs) {
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
      req.flash("error", err);
    }
    var emailVs = results[0];
    var domains = results[1];
    console.log(results);
    for (domainIdx in domains) {
      for (emailVIdx in emailVs) {
        var domain = domains[domainIdx];
        var emailV = emailVs[emailVIdx];
        if (domain.forward_email.equals(emailV._id)) {
          domain.email = emailV.email
        }
        console.log(domain);
        console.log(emailV);
        console.log(domain.forward_email);
        console.log(emailV._id);
        console.log(domain.forward_email.equals(emailV._id));
      }
    }
    res.locals.domains = domains || []
    next();
  })

}


router.use(locals_domains);
router.get('/', domains.home);
router.get('/emails', domains.emails)
router.get('/forward', domains.forward);
router.get('/tongji', domains.tongji);
router.get("/addNewDomain", domains.addNewDomain);
router.get("/newDomainSetup", domains.newDomainSetup);
router.get("/newDomainSetup2", domains.newDomainSetup2);
router.get("/api_cnameVerifyStatus", domains_api.cnameVerifyStatus);
router.get("/api_mxVerifyStatus", domains_api.mxVerifyStatus);
router.get("/setupForwardTo", domains.setupForwardTo);
router.get("/setup", domains.setup);
router.get("/api_addForwardEmail", emailVerify.addForwardEmail);
router.get("/api_emailVerify", emailVerify.emailVerify);
router.get("/api_emailVerifyList", emailVerify.emailVerifyList);
router.get("/api_removeEmailVerify", emailVerify.removeEmailVerify);

router.post("/addNewDomain", domains.addNewDomain_post);
exports.router = router;
