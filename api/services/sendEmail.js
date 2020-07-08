const defaultConfig = sails.config.email.defaultMailContent;

function getParameter(paramType, mailType, order) {
  return order.partner.mailOptions ? (order.partner.mailOptions[mailType][paramType] ||
  defaultConfig[mailType][paramType]) : defaultConfig[mailType][paramType];
}

module.exports = {
  toCustomerNewOrder: function (order, options) {
    sails.hooks.email.send('toCustomerNewOrder', {
      order:           order,
      widgetMainColor: helper.getWidgetColor(order.widget, 'color1'),
      deviceName:      order.getDeviceName(),
      deviceImageUrl:  order.getDeviceImageUrl(),
      signature:       getParameter('signature', 'toCustomerNewOrder', order)
    }, {
      to:      order.email,
      from:    defaultConfig['toCustomerNewOrder'].from,
      subject: getParameter('subject', 'toCustomerNewOrder', order)
    }, function (err, res) {
      if (err) sails.log.error(err);
      History.create({
        messages: [{error: err, response: res}],
        order:    order.id,
        type:     'customerNewOrder'
      }, function (err) {
        if (err) sails.log.error(err);
      });
    });
  },

  toDepartmentUserNewOrder: function (order, users) {
    _.each(users, function (user) {
      if (!user.email) return;
      sails.hooks.email.send('toDepartmentUserNewOrder', {
        order:           order,
        widgetMainColor: helper.getWidgetColor(order.widget, 'color1'),
        deviceName:      order.getDeviceName(),
        deviceImageUrl:  order.getDeviceImageUrl(),
        signature:       getParameter('signature', 'toDepartmentUserNewOrder', order)
      }, {
        to:      user.email,
        from:    defaultConfig['toDepartmentUserNewOrder'].from,
        subject: getParameter('subject', 'toDepartmentUserNewOrder', order)
      }, function (err, res) {
        if (err) sails.log.error(err);
        History.create({
          messages: [{error: err, response: res}],
          user:     user.id,
          order:    order.id,
          type:     'departmentNewOrder'
        }, function (err) {
          if (err) sails.log.error(err);
        });
      });
    });
  },

  toCustomerAnEstimatedOrder: function (order, options) {
    options = options || {};
    sails.hooks.email.send('toCustomerAnEstimatedOrder', {
      order:            order,
      widgetMainColor:  helper.getWidgetColor(order.widget, 'color1'),
      deviceName:       order.getDeviceName(),
      deviceImageUrl:   order.getDeviceImageUrl(),
      signature:        getParameter('signature', 'toCustomerAnEstimatedOrder', order),
      estimatorComment: options.comment
    }, {
      to:      order.email,
      from:    defaultConfig['toCustomerAnEstimatedOrder'].from,
      subject: getParameter('subject', 'toCustomerAnEstimatedOrder', order)
    }, function (err, res) {
      if (err) sails.log.error(err);
      History.create({
        messages: [{error: err, response: res}],
        order:    order.id,
        type:     'customerEstimatedOrder'
      }, function (err) {
        if (err) sails.log.error(err);
      });
    });
  },

  toCustomerNewEstimateOrder: function (order) {

    sails.hooks.email.send('toCustomerNewEstimateOrder', {
      order:           order,
      widgetMainColor: helper.getWidgetColor(order.widget, 'color1'),
      deviceName:      order.getDeviceName(),
      deviceImageUrl:  order.getDeviceImageUrl(),
      signature:       getParameter('signature', 'toCustomerNewEstimateOrder', order)
    }, {
      to:      order.email,
      from:    defaultConfig['toCustomerNewEstimateOrder'].from,
      subject: getParameter('subject', 'toCustomerNewEstimateOrder', order)
    }, function (err, res) {
      if (err) sails.log.error(err);
      History.create({
        messages: [{error: err, response: res}],
        order:    order.id,
        type:     'customerNewEstimateOrder'
      }, function (err) {
        if (err) sails.log.error(err);
      });
    });
  },

  toEstimatorNewEstimateOrder: function (order, user) {
    return new Promise((resolve, reject) =>
      sails.hooks.email.send('toEstimatorNewEstimateOrder', {
        estimator:       user,
        orderLink:       order.getEditPath(),
        widgetMainColor: helper.getWidgetColor(order.widget, 'color1'),
        order:           order,
        deviceName:      order.getDeviceName(),
        deviceImageUrl:  order.getDeviceImageUrl(),
        signature:       getParameter('signature', 'toEstimatorNewEstimateOrder', order)
      }, {
        to:      user.email,
        from:    defaultConfig['toEstimatorNewEstimateOrder'].from,
        subject: getParameter('subject', 'toEstimatorNewEstimateOrder', order)
      }, function (err, res) {
        if (err) {
          sails.log.error(err);
          return reject(err);
        }

        resolve();
      }));
  },

  toUserRecoverPassword: function (user, recoverUrl) {
    return new Promise((resolve, reject) =>
      sails.hooks.email.send('toUserRecoverPassword', {
        link: recoverUrl,
      }, {
        to:      user.email,
        subject: 'Восстановление пароля'
      }, function (err, res) {
        if (err) {
          sails.log.error(err);
          console.log(err);
          return reject(err);
        }
        sails.log.error(res);
        resolve();
      }));
  }
}
