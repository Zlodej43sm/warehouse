const S      = require('string');
const moment = require('moment');

function getDetailedPrice(price_estimated) {
  const full_price = (price_estimated / 0.805).toFixed(2);
  return {
    full_price,
    pdfo: (full_price * 0.18).toFixed(2),
    military: (full_price * 0.015).toFixed(2)
  }
}
var Order = {

  schema: true,

  attributes: {
    increment_id: {type: 'integer'},
    device: {type: 'string', defaultsTo: ''},
    device_type: {type: 'string', defaultsTo: ''},
    device_brand: {type: 'string', defaultsTo: ''},
    device_model: {type: 'string', defaultsTo: ''},
    device_images: {type: 'array'},
    notebook: {type: 'boolean'},
    device_proc: {type: 'string'},
    device_ram: {type: 'string'},
    device_hard: {type: 'string'},
    device_video: {type: 'string'},
    appearance: {type: 'integer', required: true},
    equipment: {type: 'integer', required: true},
    price_estimated: {type: 'integer', defaultsTo: 0},
    price_estimated_from: {type: 'integer', defaultsTo: 0},
    price_new: {type: 'integer', defaultsTo: 0},
    social_number: {type: 'string'},
    full_name: {type: 'string', defaultsTo: ''},
    imei: {type: 'string'},
    phone: {type: 'string', defaultsTo: ''},
    email: {type: 'string', defaultsTo: ''/*, email: true*/},
    city: {type: 'string'},
    address: {type: 'string', defaultsTo: ''},
    department: {model: 'Department'},
    product: {model: 'Product'},
    widget: {model: 'Widget'},
    partner: {model: 'Partner'},
    manager: {model: 'User'},
    history: {collection: 'History', via: 'order'},
    state: {type: 'string', enum: sails.config.app.orderStates},
    previousState: {type: 'string'},
    contractFields: {type: 'json'},
    locale: {type: 'string'},
    getDeviceName: function () {
      return this.device
        ? this.device :
        this.notebook ?
          strformat('{device_type} {device_brand} {device_model} {device_proc},' +
            ' {device_ram}, {device_hard}, {device_video}', this)
          : strformat('{device_type} {device_brand} {device_model}', this);
    },
    isOwnedBy: function (partners) {
      return _.some(partners, (p)=> this.partner.id === p.id)
    },
    getDeviceImageUrl: function () {
      return this.device
        ? urlHelper.getProductImageUrl(this)
        : urlHelper.getCustomerDeviceImageUrl(this);
    },
    isEstimate: function () {
      return !this.product;
    },
    isEstimated: function () {
      return !this.product && this.price_estimated > 0;
    },
    isRejected: function () {
      return this.state === 'rejected';
    },
    isNew: function () {
      return this.state === 'new';
    },
    isComplete: function () {
      return this.state === 'complete';
    },
    isAutoCanceled: function () {
      return this.state === 'autocancel';
    },
    getEditPath: function () {
      return urlHelper.orderEditPath(this)
    },

    getDetailedPrice() {
      return getDetailedPrice(this.price_estimated);
    },
    getContractFields: function () {
      if (this.isEstimate()) {
        return Order.fieldsForMobileContract;
      }
      const priceFields = this.getDetailedPrice();
      const tempFields              = Order.fieldsForMobileContract;
      tempFields['full name']       = this.full_name;
      tempFields.day                = moment().date();
      tempFields.month              = moment().locale('uk').format('DD MMMM').slice(3);
      tempFields['social number']   = this.social_number;
      tempFields.phone              = this.phone;
      tempFields['product imei']    = this.imei || '';
      tempFields['product name']    = this.product.name;
      tempFields['price']           = (this.price_estimated / 0.805).toFixed(2);
      tempFields['price estimated'] = this.price_estimated;
      tempFields.pdfo               = priceFields.pdfo;
      tempFields.military           = priceFields.military;
      //tempFields.description        = `${helper.appearance[this.appearance].description} ${helper.equipment[this.equipment].description}`; // until translations solution

      return _.extend({}, tempFields, this.contractFields);
    }
  },

  getDetailedPrice,
  addPhoto(id, photoName) {
    return this.findOne(id).then(function (order) {
      if (!order) return;

      if (!order.device_images) {
        order.device_images = [];
      }
      order.device_images.push(photoName);

      return new Promise(function (resolve, reject) {
        order.save(function (err) {
          if (err) return reject(err);
          resolve(order);
        });
      });
    });
  },

  beforeCreate: function (values, cb) {
    for (var key in values) {
      if (typeof values[key] === 'string') {
        values[key] = S(values[key]).escapeHTML().s;
      }
    }

    values.state = 'new';
    if (!values.product) values.state = 'estimate';
    if (!values.full_name && !values.email && !values.phone && !values.department) {
      values.state = 'pending';
    }

    Sequence.next('order', function (err, num) {
      if (err) return cb(err);
      values.increment_id = num;

      if (!values.product) return cb();
      calc(values, function (err, result) {
        if (err) return cb(err);
        values.price_estimated = result.price;
        values.price_estimated_from = result.priceFrom;
        values.price_new       = result.productPrice;
        values.device          = result.product.name;
        cb();
      });
    });
  },

  beforeUpdate: function (values, cb) {
    var messages       = []
      , omitAttributes = ['product', 'widget', 'department']
      , user           = values.user ? values.user.id : null;
    var self = this;

    self.findOne(values.id).populateAll().exec(function (err, order) {
      if (err) {
        return cb(err);
      }
      if (values.state && values.state !== order.state) {
        values.previousState = order.state;
      }
      if (Number(values.appearance) > Number(order.appearance)) {
        values.appearance = Number(order.appearance);
      }
      if (Number(values.equipment) > Number(order.equipment)) {
        values.equipment = Number(order.equipment);
      }
      // Статус confirmed присваивается внешним приложением методом PUT
      // не из админки сайта и не из виджета.
      // Но статус complete является окончательным и не должен меняться
      // Из-за несогласованности внешнего приложения и сайта
      // в реалную базу попадают записи со статусом "подтверждена""
      // который отменяет статус "завершена" - поэтому в таком случае
      if (values.state == 'confirmed' && order.state == 'complete') {
        values.previousState = 'confirmed';
      }
      if (values.state && order.state == 'complete') {
        values.state = order.state;
      }

      (values.product && !order.isComplete() ? calc: function(_m, cb){cb();})(values, function(error, calculated){
        if (calculated) {
          values.price_new = calculated.productPrice;
          values.price_estimated = calculated.price;
          //values.price_estimated_from = calculated.priceFrom;
          values.price_estimated_from = 0;
          values.device = calculated.product.name;
          values.device_model = calculated.product.name;
          values.device_brand = calculated.product.brand;
        }
        Department.findOne(values.department).exec(function(err, department) {
          if (department) {
            values.city = department.city;
            values.address = department.getFullAddress();
          }
          // if (Number(order.price_estimated) && Number(order.price_estimated) < Number(values.price_estimated)) {
          //   values.product = order.product.id;
          //   values.price_new = order.price_new;
          //   values.price_estimated = order.price_estimated;
          //   values.appearance = order.appearance;
          //   values.equipment = order.equipment;
          //   values.device = order.product.name;
          //   values.device_model = order.product.name;
          //   values.device_brand = order.product.brand;
          // }
          _.each(order, function (value, key) {
            if (values[key] !== undefined && values[key] != value && omitAttributes.indexOf(key) == -1) {
              messages.push({
                attribute: key,
                oldValue: value,
                newValue: values[key]
              });
            }
          });
          async.parallel([
            function (next) {
              if (messages.length == 0) return next();
              History.create({
                messages: messages,
                order: order.id,
                user: user,
                type: 'diff',
                system: !user
              }, next);
            },
            function (next) {
              if (!values.comment) return next();
              History.create({
                messages: [values.comment],
                order: order.id,
                user: user,
                system: !user
              }, next);
            }
          ], cb);
        });
      });
    });
  },

  afterUpdate: function(values, cb) {
    return rozetkaOrder.putOneOrder(values)
      .then (
        () => cb(),
        error => (console.log(error), cb())
      );
  },

  fieldsForMobileContract: {
    city: '',
    day: '',
    month: '',
    'full name': '',
    address: '',
    'passport seria': '',
    'passport number': '',
    'passport given by': '',
    'passport given date': '',
    'social number': '',
    'product name': '',
    'product imei': '',
    'price': '',
    'price estimated': '',
    'pdfo': '',
    'military': '',
    'description': '',
    'phone': '',
  },

  datatable: {
    editPathEx: '/o/{id}',
    columns: [
      {
        data: 'increment_id',
        title: 'ID'
      },
      {
        data: 'full_name',
        title: 'Customer Name'
      },
      {
        data: 'device',
        title: 'Device'
      },
      {
        data: null, // null - configure renderer on frontend
        title: 'Partner'
      },
      {
        data: null, // null - configure renderer on frontend
        title: 'Department'
      },
      {
        data: 'state',
        title: 'State'
      }
    ],
    filters: {
      device: function () {
        return this.getDeviceName();
      },
      state: function (user) {
        return '<div class="badge state-' + this.state + '">'
          + sails.__({phrase: 'State ' + this.state, locale: user.getLocale()})
          + '</div>';
      }
    },
    order: [[0, 'desc']]
  },

};

module.exports = Order;
