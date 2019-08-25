'use strict';

const jwt = require('./api/helpers/jwt');
var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
const conf = require('./config/default');
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
  , swaggerSecurityHandlers: {
    jwt: jwt.authorize
  }
};

SwaggerExpress.create(config, function (err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || conf.express.port;
  app.listen(port);

  if (swaggerExpress.runner.swagger.paths['/hello']) {
    console.log('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  }
});
