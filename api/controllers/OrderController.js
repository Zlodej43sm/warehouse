'use strict';
const actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');
const jade = require('jade');
const path = require('path');
const pdf = require('html-pdf');
const fs = require('fs');
const mime = require('mime');
const iconv = require('iconv-lite');
const _ = require('lodash');

const exportObject = {
  _config: {
    actions:   true,
    shortcuts: false,
    rest:      false
  },

  datatable: function(req, res) {
    const skip = parseInt(req.query.start, 10) || 0;
    const limit = parseInt(req.query.length, 10) || 10;
    const draw = parseInt(req.query.draw) || void(0);
    var orders = false;
    var Query;
    var name = false;
    var search = false;
    if (req.query.search.value && String(req.query.search.value).length > 2) {
      search = req.query.search.value;
      name = new RegExp(search, 'i');
      var products;
      Query = Product.find({name})
      .then(
        data =>
          products = _.reduce(data, (object, item) => (object[item.id] = item.name, object), {})
        ).then(
          () => helper.promify(Order, Order.native)
        ).then(
          Order =>  Order.mapReduce(
            function(){
              if (this.product && products[this.product.valueOf()]) {
                emit('matched', this._id);
              }
            }, function(key, values) {
          return {values: values};
          }, {
            scope: {products},
            out: {inline: 1},
          }
        )
      ).then(
        data => {
          if (typeof data === 'object' && typeof data.results === 'object' && typeof data.results[0] === 'object') {
            orders = data.results[0].value.values || [data.results[0].value];
          } else {
            orders = [];
          }
        }
      );
    } else {
      Query = Promise.resolve();
    }

    var user = req.user;
    var stateQuery = {};
    Query
    .then(
      () => User.findOne(user.id).populateAll(),
      error => res.negotiate(error)
    ).then(
      user => user,
      error => res.negotiate(err)
    ).then(
      async (user) => {
        if (limit) {
          stateQuery.limit = limit;
        }
        if (skip) {
          stateQuery.skip = skip;
        }
        if (req.session.orderState) {
          stateQuery.state = req.session.orderState;
        }
        if (name) {
          stateQuery.$or = [
            {device_type: name},
            {device_brand: name},
            {device_model: name},
            {device: name},
            {full_name: name},
            {email: name},
            {increment_id: search},
          ];
          if (orders) {
            stateQuery.$or.id = orders;
          }
        }
        var Query = Order.find(stateQuery).sort('id DESC');
        await user.addRoleFilterToQuery(Query);
        var QueryCount = Order.count(stateQuery);
        await user.addRoleFilterToQuery(QueryCount);
        return Promise.all([
          Query.populateAll(),
          QueryCount,
          Order.count(),
          user,
        ]);
      },
      error => res.negotiate(error)
    ).then(
        ([data, recordsFiltered, recordsTotal, user,]) =>
          //res.send({data, draw, recordsFiltered, recordsTotal,}),
          datatable.sendOk(res, Order, data, user, {draw, recordsFiltered, recordsTotal}),
        error => res.negotiate(error)
    );
  },

  apiList(req, res) { // вынести в отдельную функцию действие с префиксом /api и без него, роуты оставить разные
    var user = req.user;

    User.findOne(user.id)
      .populateAll()
      .exec(async function (err, user) {
        if (err) return res.negotiate(err);
        var stateQuery = req.query.state != undefined ? {where: {state: req.query.state}} : {};
        var query = Order.find(stateQuery);

        await user.addRoleFilterToQuery(query);

        query.exec(function (errOrder, collection) {
          if (errOrder) return res.serverError(errOrder);
          if (!collection) return res.notFound('No record found with the specified `id`.');

          res.send(collection);
        });
      });
  },

  apiGetOne(req, res){
    var pk = actionUtil.requirePk(req);

    User.findOne(req.user.id).populateAll().then((user) => { // todo: fix base auth user serialize
      Order
        .findOne(pk)
        .then(function (order) {
          if (user.isPartner() && !order.isOwnedBy(user.partners)) {
            throw res.forbidden();
          }

          if (!order) return res.notFound('No record found with the specified `id`.');

          res.send(order)
        })
        .catch(function (err) {
          if (err instanceof Error) return res.negotiate(err);
        });
    })

  },

  apiUpdate(req, res){
    const pk = actionUtil.requirePk(req);
    let values = actionUtil.parseValues(req);
    const _reject = req.param('_reject');
    const _complete = req.param('_complete');
    const _restore = req.param('_restore');

    values = _.omit(values, ['product', 'price_estimated', 'price_new', 'appearance', 'equipment', 'id']);

    User.findOne(req.user.id).populateAll().then((user) => { // todo: fix base auth user serialize
      Order
        .findOne(pk)
        .populateAll()
        .then(function (order) {
          if (user.isPartner() && !order.isOwnedBy(user.partners)) {
            throw res.forbidden();
          }

          if (_complete) {
            values.state = 'complete';
          }

          values.user = user;
          values.id = order.id;
          if (values.device_images && !(values.device_images instanceof Array)) {
            values.device_images = [values.device_images];
          }

          Order.update(pk, values).exec(function (err, updatedOrders) {
            if (err) return res.negotiate(err);
            const order = updatedOrders[0];
            return res.send(_.omit(order.toObject(), ['price_new']));
          });
        });
    })
  },

  list: function (req, res) {
    return res.view({query: req.query});
  },

  destroy: function (req, res) {
    if (!req.user.isSuperUser()) return res.forbidden();
    Order.destroy({where: {id: req.params.id}})
      .exec(function (err, data) {
        res.send(data);
      })
  },

  find: function (req, res) {
    var user = req.user;

    User.findOne(user.id)
      .populateAll()
      .exec(async function (err, user) {
        if (err) return res.negotiate(err);
        if (req.query.state && req.query.state != 'undefined') {
          req.session.orderState = req.query.state;
        } else {
          delete req.session.orderState;
        }
        var stateQuery = req.query.state != 'undefined' ? {where: {state: req.query.state}} : {};
        if (req.query.limit) {
          stateQuery.limit = parseInt(req.query.limit, 10);
        }
        var query = Order.find(stateQuery).populateAll();

        await user.addRoleFilterToQuery(query);

        query.exec(function (errOrder, collection) {
          if (errOrder) return res.serverError(errOrder);
          if (!collection) return res.notFound('No record found with the specified `id`.');
          return datatable.sendOk(res, Order, collection, user);
        });
      });
  },

  new: function (req, res) {
    Partner.find().populate('widgets').exec(function (err, partners) {
      if (!req.user.isSuperUser()) {
        const partnerIds = _.map(req.user.partners, 'id');
        partners = _.filter(partners, (p) => _.includes(partnerIds, p.id));
      }
      res.view({
        title:    res.__('New Order'),
        partners: partners,
      });
    })
  },

  upload: function (req, res) {
    req.file('file').upload({
      dirname: path.join(sails.config.appPath, '.tmp/public/media/customer-device')
    }, function (err, uploadedFiles) {
      if (err) return res.negotiate(err);
      if (uploadedFiles.length === 0) return res.badRequest('No file was uploaded');

      var file     = uploadedFiles[0]
        , basename = path.basename(file.fd);

      res.send({
        type: file.type,
        size: file.size,
        name: basename,
        url:  urlHelper.getCustomerDeviceImageUrl(basename)
      });
    });
  },

  edit: function (req, res) {
    var pk = actionUtil.requirePk(req);

    Order
      .findOne(pk)
      .populateAll()
      .then(function (order) {
        if (req.user.isPartner() && !order.isOwnedBy(req.user.partners)) {
          throw res.forbidden();
        }

        if (!order) return res.notFound('No record found with the specified `id`.');
        var history = History.find({order: order.id})
          .sort('createdAt DESC')
          .populate('user')
          .then(function (history) {
            return history
          });
        return [order, history];
      })
      .spread(function (order, history) {
        order.history = history;
        if (order.department) {
          order.city = order.department.city;
          order.address = (order.department.address
            + (order.department.house ? ', ' + order.department.house : '')
            + (order.department.comment ? ' (' + order.department.address + ')' : ''))
            .replace(/&quot;/g, '"');
        }
        if (order.product && order.product) {
          order.device = order.product.name;
          order.device_model = order.product.name;
          order.device_brand = order.product.brand;
        }
        var viewOptions = {
          order:          order,
          priceDetailed:  order.getDetailedPrice(),
          isAdmin:        req.user.isSuperUser(),
          lockedOrder:    order.manager ? true : false,
          lockedByMe:     order.manager && order.manager.id == req.user.id ? true : false,
          lockedIsAllow:  req.user.isDepartment(),
          contractFields: order.getContractFields()
        };
        res.view(viewOptions);
      })
      .catch(function (err) {
        if (err instanceof Error) return res.negotiate(err);
      });
  },

  reject: function (req, res) {
    var pk = actionUtil.requirePk(req);
    var values = {};
    values.user = req.user;
    values.id = pk;
    values.state = 'rejected';

    Order.update(pk, values).exec(function (err) {
      if (err) return res.negotiate(err);
      return res.ok();
    });
  },

  restore: function (req, res) {
    var pk = actionUtil.requirePk(req);
    var values = {};
    values.user = req.user;
    values.id = pk;

    Order
      .findOne(pk)
      .populateAll()
      .then(function (order) {
        if (req.user.isPartner() && !order.isOwnedBy(req.user.partners)) {
          throw res.forbidden();
        }
        values.state = order.previousState;
        Order.update(pk, values).exec(function (err) {
          if (err) return res.negotiate(err);
          return res.ok();
        });
      })
  },

  update: function (req, res) {
    const pk = actionUtil.requirePk(req)
    const values = actionUtil.parseValues(req)
    const _estimate = req.param('_estimate');
    const _sace = req.param('_sace');
    const _reject = req.param('_reject');
    const _complete = req.param('_complete');
    const _restore = req.param('_restore');
    const _lock = req.param('_lock');
    const _print = req.param('_print');

    Order
      .findOne(pk)
      .populateAll()
      .then(function (order) {
        if (req.user.isPartner() && !order.isOwnedBy(req.user.partners)) {
          throw res.forbidden();
        }
        var redirectTo = _sace || _estimate || _reject || _complete || _lock
          ? req.headers.referer
          : '/o' + (req.session.orderState ? '?state=' + req.session.orderState: '');

        if (_estimate && values.price_estimated <= 0) {
          req.flash('error', sails.__('Оценочная стоимость должна быть больше нуля.'));
          return res.redirect(req.headers.referer);
        }

        // originValues = _.extend({}, values);

        if (_estimate) {
          // values = {id: originValues.id};
          values.state = 'estimated';
          values.price_estimated = parseFloat(values.price_estimated, 10) || 0;
          values.price_new = parseFloat(values.price_new, 10) || 0;
        }

        if (_complete) {
          // values = {};
          values.state = 'complete';
        }

        if (_lock && req.user.isDepartment()) {
          values.manager = req.user.id;
        }

        // required for history
        values.user = req.user;
        const mailOptions = {};
        if (values.notifyCustomer === 'on') {
          mailOptions.comment = values.comment;
        }

        if (values.device_images && !(values.device_images instanceof Array)) {
          values.device_images = [values.device_images];
        }


        if (req.user.isServiceManager()) {
          if (!values.comment) return res.redirect(redirectTo);
          History.create({
            messages: [values.comment],
            order: pk,
            user: req.user.id,
            system: false
          }, () => res.redirect(redirectTo))
        } else {
          Order.update(pk, values).exec(function (err, updatedOrders) {
            if (err) return res.negotiate(err);
            const order = updatedOrders[0];
            if (_estimate && order.isEstimated()) sendEmail.toCustomerAnEstimatedOrder(order, mailOptions);
            return res.redirect(redirectTo);
          });
        }
      });
  },

  contractFields: function (req, res) {
    const orderId = req.param('id');

    Order.findOne(orderId).populateAll().exec(function (err, order) {
      const contractFields = order.getContractFields();
      res.send(contractFields);
    })
  },

  editContractFields: function (req, res) {
    const orderId = req.param('id');
    const values = _.omit(actionUtil.parseValues(req), ['id']);
    Order.update(orderId, {contractFields: values, id: orderId}).exec(function (err) {
      if (err) return res.negotiate(err);
      return res.ok();
    });
  },

  contract: function (req, res) {
    const orderId = req.param('id');
    Order.findOne(orderId).populateAll().exec(function (err, order) {
      if (err) return res.negotiate(err);

      Widget.findOne(order.widget.id).exec(function (err, widget) {
        if (err) return res.negotiate(err);

        const contract = widget.getContract(order);
        const options = {"format": "Letter"};

        pdf.create(contract, options).toStream(function (err, stream) {
          stream.pipe(res);
        });
      })
    });
  },
  create:   function (req, res) {
    var values = actionUtil.parseValues(req);

    if (values.notebook === 'on' || values.device_ram || values.device_video || values.device_hard || values.device_proc) {
      values.notebook = true; // навряд-ли это поле нужно, но выпилить времени нет
    }
    const _sace = req.param('_sace');

    if (values)
      async.waterfall([
        function (callback) {
          if (values.product && !values.device) {
            return Product.findOne(values.product).exec(function (err, product) {
              values.device = product.name;
              callback(err, product)
            })
          }
          callback(null, null)
        },
        function (product, callback) {
          Order.create(values).exec(callback);
        },
        function (createdOrder, callback) {
          Order.findOne(createdOrder.id).populateAll().exec(callback);
        },
        function (order, callback) {
          if (order.email) {
            switch (order.state) {
              case 'new':
                sendEmail.toCustomerNewOrder(order);
                break;
              case 'estimate':
                sendEmail.toCustomerNewEstimateOrder(order);
                break;
            }
          }
          callback(null, order);
        },
        function (order, callback) {
          if (order.state !== 'estimate') {
            return callback(null, order);
          }
          new Promise((resolve, reject) =>
            User
              .find({where: {role: 'E'}})
              .populate('partners')
              .exec((err, users, c) => err ? reject(err) : resolve(users)))
            .then((users) => _.filter(users, (u) => _.some(u.partners, (p) => p.id === order.partner.id)))
            .then((users) =>
              _.reduce(users, (promise, user) =>
                  promise
                    .then(() => sendEmail.toEstimatorNewEstimateOrder(order, user))
                , Promise.resolve()));

          callback(null, order);
        },
        function (order, callback) {
          if (!order.department) {
            return callback(null, order);
          }
          Department
            .findOne(order.department.id)
            .populate('users')
            .exec(function (err, department) {
              if (err) callback(err);
              if (department.users.length) {
                sendEmail.toDepartmentUserNewOrder(order, department.users);
              }
              callback(null, order);
            })
        }
      ], function (err, order) {
        if (err) res.negotiate(err);

        const redirectTo = _sace && `/o/${order.id}`;
        if (redirectTo) {
          return res.redirect(redirectTo);
        } else {
          return res.send(_.pick(order, [
            'id',
            'increment_id',
            'widget',
            'partner',
            'product',
            'appearance',
            'equipment',
            'price_estimated',
            'device_type',
            'device_model',
            'device_brand',
            'device_images',
            'notebook',
            'device_proc',
            'device_ram',
            'device_hard',
            'device_video',
          ]));
        }

      });

  },

  customerEdit: function (req, res) {
    var pk = actionUtil.requirePk(req);

    Order
      .findOne(pk)
      .populate('widget')
      .populate('product')
      .populate('department')
      .exec(function (err, order) {
        if (err) return res.negotiate(err);
        if (!order) return res.notFound();

        res.view({
          texts:        order.widget.getTexts(),
          primaryColor: helper.getWidgetColor(order.widget, 'color1'),
          widgetWidth:  helper.getWidgetWidth(order.widget),
          order:        order
        });
      });
  },

  customerUpdate: function (req, res) {
    var pk     = actionUtil.requirePk(req)
      , values = actionUtil.parseValues(req);

    values.state = 'confirmed';

    Order.update(pk, values).exec(function (err, updatedOrders) {
      if (err) return res.negotiate(err);
      var order = updatedOrders[0];

      /**
       * SEND EMAIL TO DEPARTMENT USER
       */
      if (order.department) {
        Department.findOne(order.department).populate('users').exec(function (err, department) {
          if (err) sails.log.error(err);
          sendEmail.toDepartmentUserNewOrder(order, department);
        })
      }

      return res.ok();
    });
  },

  export: function (req, res) {
    var json2csv = require('json2csv');
    var fields = {
      'state':           sails.__('State'),
      'managerEmail':    sails.__('Manager Email'),
      'city':            sails.__('City'),
      'address':         sails.__('Department Address'),
      'managerName':     sails.__('Manager Name'),
      'device':          sails.__('Device'),
      'price_new':       sails.__('Price New'),
      'appearance':      sails.__('Appearance'),
      'equipment':       sails.__('Equipment'),
      'price':           sails.__('Price gross'),
      'price_estimated': sails.__('Price net'),
      'full_name':       sails.__('Customer Name'),
      'email':           sails.__('Customer Email'),
      'phone':           sails.__('Customer Phone'),
      'createdAt':       sails.__('Created At'),
      'updatedAt':       sails.__('Updated At'),
      'isEstimated':     sails.__('Processed Appraiser'),
    };
    var query    = Order.find()
      , state    = req.param('state')
      , partner  = req.param('partner')
      , fromDate = req.param('fromDate')
      , toDate   = req.param('toDate');

    if (partner) {
      query.where({partner: partner});
    }

    if (state) {
      query.where({state: state});
    }

    if (fromDate && toDate) {
      query.where({createdAt: {'>=': fromDate, '<=': toDate}});
    }

    query.populateAll().exec(function (err, orders) {
      if (err) return res.negotiate(err);
      var partnerTitle = orders[0].partner.title.replace(/(?!\w)[\x00-\xC0]/g, '_');

      orders = _.map(orders, function (o) {
        o.state = req.__('State ' + o.state);
        o.device = o.getDeviceName();
        o.managerEmail = o.manager ? o.manager.email : '';
        o.managerName = o.manager ? o.manager.getName() : '';
        o.createdAt = moment(o.createdAt).format('L LT');
        o.updatedAt = moment(o.updatedAt).format('L LT');
        o.isEstimated = o.isEstimated() ? '+' : '';
        return o;
      });

      const encodind = 'utf-16';
      json2csv({
        del: '\t',
        data:       orders,
        fields:     _.keys(fields),
        fieldNames: _.values(fields)
      }, function (err, csv) {
        if (err) sails.log.error(err);
        var filename = ['report_', partnerTitle];
        if (state) filename.push('state_' + state);
        filename.push(moment().format("DD.MM.YYYY_HH.mm.ss"));
        filename = filename.join('_').toLowerCase().replace(/_+/g, '_') + '.csv';
        res.attachment(filename);
        const encodedCSV = iconv.encode(csv, encodind);
        res.header('Content-type', `text/csv; charset=${encodind}`);
        res.end(encodedCSV);
      });
    });
  },

};

module.exports = exportObject;
