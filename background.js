require('babel-register')({
  "presets": [
    "es2015",
    "es2017",
//    "react",
    "stage-0"
  ],
  "plugins": [
//    "transform-decorators-legacy",
  ]
});
require('babel-polyfill');
const process = require('process');
process.chdir(__dirname);
const sails = require('sails');
const cron = require('node-cron');
const rc = require('rc');

sails.load({
    hooks: {
      blueprints: false,
      controllers: false,
      cors: false,
      csrf: false,
      grunt: false,
      http: false,
      i18n: false,
      logger: false,
      //orm: leave default hook
      policies: false,
      pubsub: false,
      request: false,
      responses: false,
      //services: leave default hook,
      session: false,
      sockets: false,
      views: false,
    }
  }, function(err, app) {

    cron.schedule('*/37 * * * *', function() {
      return helper.syncProducts();
    });
    cron.schedule('0 0 * * * *', function() {
      return helper.autoCancelOrders();
    });
    cron.schedule('0 53 0 * * *', function() {
      return rozetka.getCities();
    });
    cron.schedule('0 */17 * * * *', function() {
      return rozetka.syncDepartments();
    });
    cron.schedule('0 */7 * * * *', function() {
      return rozetkaOrder.getRozetkaIds();
    });
    cron.schedule('0 */13 * * * *', function() {
      return rozetkaOrder.syncExternalOrders();
    });

  });
