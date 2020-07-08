/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function(cb) {
  var locale = sails.config.i18n.defaultLocale;

  // load passport auth strategies
  // sails.services.passport.loadStrategies();

  // init strformat
  GLOBAL.strformat = require('strformat');

  // init moment.js
  GLOBAL.moment = require('moment');
  require('moment/locale/' + locale);
  moment.locale(locale);


  // init numeral.js
  GLOBAL.numeral = require('numeral');
  numeral.language('ru', {
    delimiters: {
      thousands: ' ',
      decimal: ','
    },
    abbreviations: {
      thousand: 'тыс.',
      million: 'млн',
      billion: 'b',
      trillion: 't'
    },
    ordinal : function (number) {
      return '.';
    },
    currency: {
      symbol: 'грн.'
    }
  });
  numeral.language('en-gb', {
    delimiters: {
      thousands: ' ',
      decimal: ','
    },
    abbreviations: {
      thousand: 'ths',
      million: 'm',
      billion: 'b',
      trillion: 't'
    },
    ordinal : function (number) {
      return '.';
    },
    currency: {
      symbol: 'грн.'
    }
  });
  numeral.language(locale);

  // init scheduler service based on later.js
  scheduler();

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
