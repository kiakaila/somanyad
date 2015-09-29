
var emailVerify = require("./api_emailVerify");
var domains = require("./domains");
var domains_api = require("./api_domains");
var router = require("express").Router();
var Domain = require("../../models/Domain").Domain;

function locals_domains (req, res, next) {
    Domain.find({user: req.user._id}, function (err, domains) {
      if (err) {
        domains = [];
      }
      res.locals.domains = domains;
      next();
    });
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
