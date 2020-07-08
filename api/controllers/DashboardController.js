module.exports = {

  index: function (req, res) {
    var user = req.user;
    if (user.isEstimator() || user.isDepartment() || user.isExpert()) {
      return res.view('dashboard/estimator', { title: 'Dashboard' });
    }
    Promise.resolve(
    ).then(
      () => helper.promify(Order, Order.native),
      error => res.negotiate(error)
    ).then(
      async Order => {
        var filter = await user.getRoleFilterForQuery();
        const query = Order.aggregate([{$match: filter }, {$group: {_id: '$state', count: {$sum: 1}}}]);
        return query.toArray();
      },
      error => res.negotiate(error)
    ).then(
      data => res.view({
        title: res.__('Dashboard'),
        ordersCount: _.reduce(data, (sum, item) => (sum + item.count), 0),
        ordersCountByState: _.reduce(data, (total, item) => (total[item._id] = item.count, total), {}),
      }),
      error => res.negotiate(error)
    );
  },

  report: function (req, res) {
    var user     = req.user
      , fromDate = req.param('fromDate')
      , toDate   = req.param('toDate');

    async.waterfall([
      function(callback){
        User.findOne(user.id)
        .populateAll()
        .exec(function (err, user) {
          if (err) return callback(err);
          callback(null, user);
        });
      },
      async function(user, callback){
        var query = Order.find().populate('partner');
        await user.addRoleFilterToQuery(query);
        if (fromDate && toDate) {
          query.where({
            createdAt: { '>=': fromDate, '<=': toDate }
          })
        }
        query.exec(function (err, orders) {
          if (err) return callback(err);
          callback(null, orders);
        });
      }
    ],
    function(err, orders) {
      if (err) return res.negotiate(err);
      var data    = []
        , reports = {}
        , states  = sails.config.app.orderStates
        , columns = [
          {data: "partner.title", title: sails.__({phrase:"Partner", locale: user.getLocale()})},
          {
            data: {
              buttonType: 'actions'
            },
            title: sails.__({phrase:"Actions", locale: user.getLocale()}),
            orderable: false,
            searchable: false
          },
        ];

      _.each(states, function (state) {
        columns.push({
          data: state,
          title: sails.__({phrase:'State ' + state, locale: user.getLocale()}),
          searchable: false
        });
      });

      _.each(orders, function (order) {
        if (!order.partner) return;
        var id = order.partner.id;

        if (!reports[id]) {
          reports[id] = { partner: order.partner };
          _.each(states, function (state) {
            reports[id][state] = 0;
          });
        }

        reports[id][order.state] += 1;
      });

      _.each(reports, function (record) {
        data.push(record);
      });

      res.ok({
        columns: columns,
        data: data
      });
    });
  },

};
