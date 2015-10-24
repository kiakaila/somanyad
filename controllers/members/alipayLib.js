var secrets = require("../../config/secrets");
var crypto = require('crypto');

// order_id_str 订单id
// order_name_str 订单名称
// order_money_str 订单金额
// order_about_str 订单描述
exports.pay_order_url = function (order_id_str, order_name_str, order_money_str, order_about_str) {

  order_about_str = order_about_str || "无"

  var key = secrets.alipay.key;
  var gateway = secrets.alipay.gateway;
  var partner = secrets.alipay.partner;
  var notify_url = secrets.alipay.notify_url;
  var return_url = secrets.alipay.return_url;
  var seller_email = secrets.alipay.seller_email;

  var kvs = [
    ["service", "create_direct_pay_by_user"],
    ["partner", partner],
    ["_input_charset", "utf-8"],
    ["notify_url", notify_url],
    ["return_url", return_url],
    ["out_trade_no", order_id_str],
    ["subject", order_name_str],
    ["body", order_about_str],
    ["payment_type", "1"],
    ["logistics_type", "EXPRESS"],
    ["logistics_fee", "0"],
    ["logistics_payment", "SELLER_PAY"],
    ["price", order_money_str],
    ["quantity", "1"],
    ["seller_email", seller_email]
  ].sort();

  var url = kvs.reduce(function (previous, elem) {
    if (previous != "") {
      return previous + "&" + elem.join("=")
    }
    return elem.join("=")
  });

  var shasum = crypto.createHash('md5');
  shasum.update(url + key);
  var sign = shasum.digest('hex');
  var sign_type = "MD5";
  url += "&sign=" + sign + "&sign_type=" + sign_type;
  url = gateway + "?" + url
  return url;
}
