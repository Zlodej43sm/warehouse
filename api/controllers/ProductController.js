'use strict';
const actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil')
const path       = require('path');
const fs         = require('fs');
const iconv      = require('iconv-lite');

module.exports = {

  list: function (req, res) {
    return res.view();
  },

  sync: function (req, res) {
    console.log('*** begin product sync ***');
    res.connection.setTimeout(10 * 60 * 1000);
    req.setTimeout(10 * 60 * 1000);
    const referer = req.headers.referer;

    helper.syncProducts(function (err) {
      if (err){
        console.log('*** error product sync ***');
        console.log(err)
        return res.negotiate(err);
      }
      console.log('*** success product sync ***');
      res.redirect(referer || '/products');
    })
  },

  /*restore: function (req, res) {
    let products;
    try {
      products =  JSON.parse(fs.readFileSync(`products.json`).toString());
    } catch (error) {
      console.log(error)
      return res.negotiate(error);
    }

    Product.drop(function () {
      Product.create(products, function (err, createdProducts) {
        if (err) return res.negotiate(err);
        res.redirect('/products');
      });
    })
  },*/
  upload: function (req, res) {
    const id = req.param('id');
    if (!id) {
      return res.notFound();
    }
    req.file('file').upload({
      dirname: path.join(sails.config.appPath, '.tmp/public/media/product')
    }, function (err, uploadedFiles) {
      if (err) return res.negotiate(err);
      if (uploadedFiles.length === 0) return res.badRequest('No file was uploaded');

      var file     = uploadedFiles[0]
        , basename = path.basename(file.fd);

      Product.update(id, {image: basename}, function (err, product) {
        if (err) return res.negotiate(err);
        res.json({
          type: file.type,
          size: file.size,
          name: basename
        });
      })
    });
  },

  apiList(req, res){
    Product.find({deleted: {not: true}}).exec(function (err, products) {
      if (err) {
        return res.negotiate();
      }

      products = _.map(products, (product) => {
        product              = _.omit(product.toObject(), ['createdAt', 'updatedAt'])
        return product;
      });
      res.send(products)
    })
  },

  apiByWidgetList(req, res){
    Widget.findOne({ uniqueId: req.param('widget') }).then(
      widget => {
        if (!widget) {
          return res.send([]);
        }
        const koeff = widget.priceCoeff || 1;
        return Product.find({ deleted: { not: true } }).then(
          products => {
            products = _.map(products, product => {
              product = _.omit(product.toObject(), ['createdAt', 'updatedAt']);
              product.realPrice = product.price;
              product.price = String(Math.round(product.price * koeff));
              return product;
            });
            res.send(products)
          }
        )
      },
    ).catch(
      err => res.negotiate(err)
    )
  },

  apiRawList(req, res){
    helper.getRawProducts(function (products) {
      res.send(products);
    })
  },

  coeff: function (req, res) {
    const values = actionUtil.parseValues(req);
    const result = helper.setPriceCoeff(values);
    res.ok(result);
  },

  datatable: function(req, res) {
    const skip = parseInt(req.query.start, 10) || 0;
    const limit = parseInt(req.query.length, 10) || 10;
    const draw = parseInt(req.query.draw) || void(0);
    var options;
    if (req.query.search.value) {
      var name = new RegExp(req.query.search.value, 'i');
      options = {limit, skip, name};
    } else {
      options = {limit, skip};
    }
    Promise.all([
      Product.find(options),
      Product.count(options),
      Product.count(),
    ]).then(
      ([data, recordsFiltered, recordsTotal,]) =>
        res.send({data, draw, recordsFiltered, recordsTotal,}),
      error =>
        res.negotiate(error)
    );
  },

};
