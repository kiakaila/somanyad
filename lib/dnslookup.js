
var dns = require('dns');
var _ = require("underscore");

var cnameVerify = exports.cnameVerify = function(cname, ourSubDomain, cb) {
  // verify domain's cname point to ourSubDomain
  dns.resolve(cname, "CNAME", function(err, addresses) {

    if (!err && addresses && addresses.length == 1 && addresses[0] === ourSubDomain) {

      cb();
      return
    }

    cb(err || new Error("CNAME lookup failure!"));
  })
}


var crypto = require('crypto')
var setting = require("../config/secrets")

// 计算 cname 别名后缀
function calCnameSuffix (str, count) {
	// 通过 domain 和 user._id 计算得到一个数字XXX
	// 然后 要求用户将 domain 的 somanyadXXX.com 指向 verify.cname.somanyad.com
	var shasum = crypto.createHash('md5');
	shasum.update(str);
	var hex = shasum.digest('hex');
	var num = parseInt(hex, 16) % Math.pow(10, count || 4);
	return num.toString();
}
exports.calSuffix = calCnameSuffix;
var cnameFun = exports.cnameFun = function (domain, uid) {
  var str = domain + uid
	var suffix = calCnameSuffix(str)
	var cname = setting.cnamePre + suffix + "." + domain
  return cname;
}

// 建立并绑定某个域名到某个用户身上
exports.domainVerify = function (domain, uid, cb) {
	var cname = cnameFun(domain, uid);
	// 验证 cname 指向
	cnameVerify( cname, setting.cnamePointTo, function (err) {
		if (err) {
			return cb(err);
		}
    var result = {
      cname: cname,
      pointTo: setting.cnamePointTo
    }

    return cb(null, result);
	});
}

var mxVerify = exports.mxVerify = function (domain, mxs, cb) {
  dns.resolve(domain, "MX", function (err, addresses) {
    if (err) {
      return cb(err);
    }
    var exchanges = addresses.map(function (address) {
      return address.exchange
    })

    if (_.intersection(mxs, exchanges).length >= 1) {
      return cb();
    }
    return cb(new Error("MX verify failure!"));
  });
}
