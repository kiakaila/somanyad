var mongoose = require('mongoose');
var secrets = require('./somanyad/config');

/**
 * Connect to MongoDB.
 */
mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Please make sure that MongoDB is running.');
});
// 部署测试6
