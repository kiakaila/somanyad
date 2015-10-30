// http://localhost:3000/members/aplipay/create_partner_trade_by_buyer/return_url?body=undefined&buyer_email=237009522%40qq.com&buyer_id=2088012501703670&discount=0.00&gmt_create=2015-10-26+19%3A28%3A05&gmt_logistics_modify=2015-10-26+19%3A28%3A05&gmt_payment=2015-10-26+19%3A28%3A29&is_success=T&is_total_fee_adjust=N&logistics_fee=0.00&logistics_payment=SELLER_PAY&logistics_type=EXPRESS&notify_id=RqPnCoPT3K9%252Fvwbh3InVa46BL2SnjetFOQQRk7A8LvEqrwBKCINGJgnGsUkDpkJzeKv7&notify_time=2015-10-26+19%3A28%3A34&notify_type=trade_status_sync&out_trade_no=562e0e11024b2b2110507c05&payment_type=1&price=0.01&quantity=1&receive_address=undefined&receive_mobile=undefined&receive_name=undefined&receive_phone=undefined&receive_zip=undefined&seller_actions=SEND_GOODS&seller_email=ljy080829%40gmail.com&seller_id=2088102062322622&subject=%E8%B4%AD%E4%B9%B0+somanyad.com+%E4%BC%9A%E5%91%98%E6%9C%8D%E5%8A%A1%3A+2015-10-26---2016-10-26&total_fee=0.01&trade_no=2015102600001000670062629977&trade_status=WAIT_SELLER_SEND_GOODS&use_coupon=N&sign=3a42af9d11cc95e05dfa9d50c86a7b0f&sign_type=MD5

var chai = require('chai');
var should = chai.should();
var app = require('../app.js');
var User = require('../models/User');

describe('User Model', function() {
  it('should create a new user', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) return done(err);
      done();
    });
  });

  it('should not create a user with the unique email', function(done) {
    var user = new User({
      email: 'test@gmail.com',
      password: 'password'
    });
    user.save(function(err) {
      if (err) err.code.should.equal(11000);
      done();
    });
  });

  it('should find user by email', function(done) {
    User.findOne({ email: 'test@gmail.com' }, function(err, user) {
      if (err) return done(err);
      user.email.should.equal('test@gmail.com');
      done();
    });
  });

  it('should delete a user', function(done) {
    User.remove({ email: 'test@gmail.com' }, function(err) {
      if (err) return done(err);
      done();
    });
  });
});
