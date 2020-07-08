var _     = require('lodash')
  , later = require('later')
  , tasks = [];


/* tasks.push(function autoCancelOrders () {
  var shed       = later.parse.text('every 1 hour')
    , now        = moment().format()
    , offsettime = moment(now).add(-2, 'days').format();

  later.setInterval(function () {
    Order.find()
    .where({
      state: ['new', 'estimate'],
      updatedAt: { '<': offsettime }
    })
    .exec(function (err, orders) {
      if (err) sails.log.error(err);
      _.each(orders, function (order) {
        Order.update(order.id, {
          state: 'autocancel',
          id: order.id
        })
        .then(function () {
          sails.log.info('autocancel order by id: ', order.id);
        })
        .catch(function (err) {
          if (err) sails.log.error(err);
        })
      })
    });
  }, shed);

});*/


module.exports = function () {
  _.each(tasks, function (fn) { fn() });
};
