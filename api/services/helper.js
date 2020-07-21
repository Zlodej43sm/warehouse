const util = require('util');
const fs = require('fs');
const path = require('path');
const xml        = require('xml2json');
const Client     = require('ftp');
const iconv      = require('iconv-lite');
const coeffFile = path.resolve(__dirname, '../../Coeffs.json');
const _ = require('lodash');
const moment = require('moment');
const rulesList = require('../../config/rulesList');

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = {
  getRawProducts(cb){
    const c = new Client();
    c.on('error', function() {
      c.end();
      c.abort();
    });
    c.on('ready', function () {
      let result = '';
      c.get('/exch_comfy/tehnostokComfy.xml', function (err, stream) {
        stream.on('data', function (data) {
          result += iconv.decode(data, 'win1251');
        });
        stream.on('end', function () {
          c.end();
          cb(result);
        });
        stream.on('error', function (error) {
          console.log(error);
          stream.close();
          c.end()
        });
        if (err) console.log(err);
      })
    });
    c.connect({
      host: 'ftp.partner.credit',
      user: 'exch_comfy_read',
      password: 'jh75T$$@K2687P',
      connTimeout: 10 * 60 * 1000,
      pasvTimeout: 10 * 60 * 1000,
    });
  },

  syncProducts(cb){
    cb = cb || function () {};
    async function parseProducts(xmlResponse) {
      let objResponse;
      try {
        objResponse = JSON.parse(xml.toJson(xmlResponse));
      } catch (err) {
        return cb(err);
      }

      let products = objResponse.TehnoStok.Commodity;

      if (products.length == 0) {
        sails.log.error(new Error('Wrong products count'));
        return cb({err: 'no products'})
      }

      products = _.map(products, function (product) {
        var name  = _.trim(product.Nomenklatura)
          , image = typeof product.Image === 'string' ? product.Image : null;
        return {
          name:  name,
          type:  product.TypeNomenklatura,
          model: product.Model,
          brand: product.Brand,
          description: product.Description,
          price: parseFloat(product.Price, 10),
          image: image
        }
      });
      let escaped = await Product.find({'name': {contains: '&'}});
      console.log(escaped.length);
      for (let i = 0; i < escaped.length; i++) {
        escaped[i].name = escaped[i].name.replace(/&quot;/g, '"');
        console.log(escaped[i]);
        await escaped[i].save();
      }
      await Product.update({}, {active: false});
      for (let i = 0; i < products.length; i++) {
        try {
          let {name, type, model, brand, description, price, image} = products[i];
          let active = true;
          name = name.replace(/&quot;/g, '"')
          let product = await Product.findOrCreate({name}, {
            name, type, model, brand, description: 'new', price, image, active
          });
          if (product.description === 'new') {
            console.log('*** new product  with new _id ***');
            console.log(product);
          }
          if (!image) {
            image = product.image;
          }
          Object.assign(
            product,
            {name, type, model, brand, price, description, image, active}
          );
          await product.save();
        } catch (ex) {
          console.log('*** load product error ***');
          console.log(products[i]);
          console.log(ex);
        }
      }
      await Product.update({active: false}, {deleted: true, price: 0});
      await Product.update({active: true}, {deleted: false});
      cb();
    }

    //const fileWriteStream = new fs.WriteStream('./t.xml')
    const c = new Client();
    c.on('error', function() {
      c.end();
      c.abort();
    });
    c.on('ready', function () {
      let result = '';
      c.get('/exch_comfy/tehnostokComfy.xml', function (err, stream) {
        stream.on('data', function (data) {
          result += iconv.decode(data, 'win1251');
        });

        stream.on('end', function () {
          c.end();
          parseProducts(result);
        });

        stream.on('error', function (error) {
          console.log(error);
          stream.close();
          c.end();
        });

        if (err) console.log(err);
      })
    });
    c.connect({
      host: 'ftp.partner.credit',
      user: 'exch_comfy_read',
      password: 'jh75T$$@K2687P',
      connTimeout: 10 * 60 * 1000,
      pasvTimeout: 10 * 60 * 1000,
    });
  },

  isCurrentPage: function (req, controller, action) {
    var isCurrent = true;

    if (_.isArray(action)) {
      isCurrent = isCurrent && action.indexOf(req.options.action) != -1;
    }

    if (_.isString(action)) {
      isCurrent = isCurrent && req.options.action === action;
    }

    return isCurrent && req.options.controller === controller;
  },

  getCurrentPageClass: function (req, navItem) {
    var controller = navItem.controller
      , action     = navItem.action;

    return this.isCurrentPage(req, controller, action) ? 'active' : '';
  },

  includeJsByController: function (req) {
    var fs           = require('fs')
      , assetsJsPath = [process.cwd(), 'assets', 'js'].join('/')
      , scriptPath;

    if (req && !req.options.controller) {
      return;
    }

    var scriptFile = req.options.controller + '.js';
    var scriptSrc = '/js/' + scriptFile;
    var scriptFilePath = [assetsJsPath, scriptFile].join('/');

    try {
      fs.statSync(scriptFilePath).isFile();
      return '<script src="' + scriptSrc + '"></script>'
    } catch (e) {
      sails.log.warn(e.message)
    }
  },

  getWidgetWidth: function (widget) {
     return (widget && widget.width) || sails.config.app.widget.defaultWidth;
  },

  getWidgetCoverUrl: function (widget) {
    return util.format('%s/widget/coverimage?id=%s', helper.getBaseUrl(), widget.id);
  },

  getWidgetColor: function (widget, colorType) {
    if (widget && widget[colorType]) return widget[colorType];
    return sails.config.app.widget[colorType];
  },

  prepareWidgetPrimaryColor: function (values) {
    if (this.getWidgetColor(undefined, 'color1') == values.color1) {
      delete values.color1;
    }
  },

  startCase: function (text) {
    return _.startCase(text);
  },

  formatPrice:   function (num, withoutCurrency) {
    var format = withoutCurrency ? '0,0[.]00' : '0,0[.]00 $';
    return numeral(num).format(format);
  },

  getWidgetCoeff: function (widget) {
     return widget.priceCoeff || 1;
  },

  setPriceCoeff: function (values) {
    const resultObject = _.pick(values, ['productPrice']);

    if (!isNumeric(resultObject.productPrice) || resultObject.productPrice < 0) {
      return;
    }
    try {
      fs.writeFileSync(coeffFile, JSON.stringify(resultObject));
      return resultObject;
    } catch (error) {
      console.log(error);
    }

    return;
  },
  getPriceCoeff: function () {
    var coeffs;
    if (fs.existsSync(coeffFile)) {
      try {
        coeffs = JSON.parse(fs.readFileSync(coeffFile).toString());
      } catch (error) {
        console.log(error)
      }
    }
    return (coeffs && coeffs.productPrice) ? parseFloat(coeffs.productPrice) : 1;
  },

  getAllowToCreateUserRoles: function (user) {
    if (user.isSuperUser()) {
      return sails.config.acl.roles;
    }

    if (user.isPartner()) {
      return ['E', 'D', 'SM',];
    }

    return [];
  },

  autoCancelOrders: function() {
    var offsettime = moment().add(-2, 'days').format();
    return Order.find()
      .where({
        state: ['new', 'estimate', 'pending'],
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
  },

  getBaseUrl: function() {
    return sails.config.proxyProtocol + '://' + sails.config.proxyHost + ':' + sails.config.proxyPort;
  },

  promify: function(self, func, ...args) {
      return new Promise(function(resolve, reject) {
          // node.js object.method(...args, callback)
          // callback is last element of arguments list
          // callbcak signature callbcak(error, data)
          args.push(function(error, data) {
              if (error) {
                  reject(error);
              } else {
                  if (data) {
                    resolve(data);
                  } else {
                    resolve(self);
                  }
              }
          });
          func.apply(self, args);
      });
  },

  promisay: function(self, func, ...args) {
      return new Promise(function(resolve, reject) {
          // node.js object.method(...args, callback)
          // callback is last element of arguments list
          // callbcak signature callbcak(error, data)
          args.push(function(error, ...data) {
              if (error) {
                  reject(error);
              } else {
                  if (data) {
                    resolve(data);
                  } else {
                    resolve(self);
                  }
              }
          });
          func.apply(self, args);
      });
  },

  ...rulesList,
};
