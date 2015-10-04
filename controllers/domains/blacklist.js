var BlackReceiveList = require("../../models/Domain").BlackReceiveList;

// 为某域名添加黑名单
// middleware.userOwnerDomain
exports.addBlackList_post = function (req, res) {
  var domainStr = req.query.domain;
  var blockAddress = req.body.blockAddress;
  var replyInfo = req.body.replyInfo;

  // domainStr
  var obj = {
    user: req.user._id,
    domain: res.locals.domain._id,
    blockAddress: blockAddress,
    replyInfo: replyInfo
  }

  BlackReceiveList.findOrCreate(obj, function (err, blackItem) {
    if (err || blackItem == null) {
      err = err || new Error("create blackItem failure!");
      req.flash('errors', { msg: err.message });
    }
    return res.redirect("/domains/edit?domain=" + domainStr);
  });
}


// 修改黑名单回退信息
// middleware.userOwnerDomain
exports.changeBlackItemReplyinfo_post = function (req, res) {
  var domainStr = req.query.domain;
  var blockAddress = req.query.blockAddress;
  var replyInfo = req.body.replyInfo;

  var obj = {user: req.user._id, domain: res.locals.domain._id, blockAddress: blockAddress};
  BlackReceiveList.update(obj, {replyInfo: replyInfo}, function (err, blackItem) {
    if (err) {
      req.flash('errors', { msg: err.message })
    }
    return res.redirect("/domains/edit?domain=" + domainStr);
  });
}
// 删除某条黑名单
// middleware.userOwnerDomain
exports.removeBlackItem = function (req, res) {
  var domainStr = req.query.domain;
  var blockAddress = req.query.blockAddress;
  var obj = {
    user: req.user._id,
    domain: res.locals.domain._id,
    blockAddress: blockAddress
  }
  BlackReceiveList.remove(obj, function (err) {
    if (err) {
      req.flash('errors', { msg: err.message })
    }
    return res.redirect("/domains/edit?domain=" + domainStr);
  });
}
