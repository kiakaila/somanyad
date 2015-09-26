
var emailVerify = require("./api_emailVerify");
var domains = require("./domains");
var domains_api = require("./api_domains");


exports.api_addForwardEmail = emailVerify.addForwardEmail;
exports.api_emailVerify = emailVerify.emailVerify;
exports.api_emailVerifyList = emailVerify.emailVerifyList;
exports.api_removeEmailVerify = emailVerify.removeEmailVerify;


exports.api_cnameVerifyStatus = domains_api.cnameVerifyStatus;
exports.api_mxVerifyStatus = domains_api.mxVerifyStatus;




exports.home = domains.home;
exports.setup = domains.setup;
exports.emails = domains.emails;
exports.emails_forward = domains.emails_forward;
exports.forward = domains.forward;
exports.tongji = domains.tongji;
exports.addNewDomain = domains.addNewDomain;
exports.addNewDomain_post = domains.addNewDomain_post;
exports.newDomainSetup = domains.newDomainSetup;
exports.setupForwardTo = domains.setupForwardTo;
