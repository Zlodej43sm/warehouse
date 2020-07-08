require('babel-register')({
  presets: [
    'es2015',
    'es2017',
    // react,
    'stage-0'
  ],
  plugins: [
    // 'transform-decorators-legacy',
  ]
});
require('babel-polyfill');

const process = require('process');
process.chdir(__dirname);
const sails = require('sails');

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
},
function(err, app) {
  Promise.resolve()
  .then(
    () => rozetkaOrder.test()
  ).then(
    () => rozetka.getCities()
//  ).then(
//    () => rozetka.syncDepartments()
//  ).then(
//    () => rozetkaOrder.getRozetkaIds()
//  ).then(
//    () => rozetkaOrder.syncExternalOrders()
  );
});
