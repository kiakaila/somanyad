/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.price = function (req, res) {
  res.render('price', {
    title: "Price"
  })
}

exports.product = function (req, res) {
  res.render('product', {
    title: 'Product'
  })
}
