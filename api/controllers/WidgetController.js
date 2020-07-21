var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil')
  , path       = require('path');

var uploadCoverImage = function (req, cb) {
  req.file('coverImage').upload({}, function (err, uploadedFiles) {
    // if (err) return res.negotiate(err);
    cb(uploadedFiles);
  });
};

module.exports = {

  _config: {
    actions:   false,
    shortcuts: false,
    rest:      false
  },

  create: function (req, res) {
    var values = actionUtil.parseValues(req);

    helper.prepareWidgetPrimaryColor(values);

    uploadCoverImage(req, function (uploadedFiles) {
      if (uploadedFiles.length > 0) values.coverImageFd = uploadedFiles[0].fd;
      Widget.create(values).exec(function (err, newInstance) {
        if (err) return res.negotiate(err);
        res.created(newInstance);
      })
    });
  },

  update: function (req, res) {
    var pk     = actionUtil.requirePk(req)
      , values = actionUtil.parseValues(req);

    helper.prepareWidgetPrimaryColor(values);

    uploadCoverImage(req, function (uploadedFiles) {
      if (uploadedFiles.length > 0) values.coverImageFd = uploadedFiles[0].fd;
      if (values.deleteCover) values.coverImageFd = null;
      Widget.update(pk, values).exec(function (err, updatedItems) {
        if (err) return res.negotiate(err);
        res.ok(updatedItems[0]);
      })
    });
  },

  instance: function (req, res) {
    var id = req.param('id'); // uniqueId
    let locale = 'en';
    if (req.headers.referer && /\/ua\//g.test(req.headers.referer)) {
      locale = 'ua';
    }

    Widget
      .findOne({uniqueId: id}).populate('partner')
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });

        Department.find({partner: widget.partner.id}, function (err, departments) {
            let cities = [];

            if (departments) {
              cities = departments.map(item => item.city);
            }
            const viewData = {
              widget:         widget,
              texts:          widget.getTexts(locale),
              styles:         widget.getStyles(),
              cities:         cities,
              appearance:     widget.getCustomAppearance(),
              equipment:      widget.getCustomEquipment(),
              extended:       widget.getExtended(),
              secondaryColor: helper.getWidgetColor(widget, 'color2'),
              textColor:      helper.getWidgetColor(widget, 'textColor'),
              primaryColor:   helper.getWidgetColor(widget, 'color1'),
              postUrl:        (widget.type === 'rozetka') ? sails.config.partnerRozetka.postUrl : null,
              locale,
            };
            return res.view(viewData);
          })
        })
        // const query = Department
          // .find({partner: widget.partner.id})
          // .groupBy('city')
          // .sum('count')
          // .sort({city: 'ASC'})
          // .exec(function (err, departments) {
          //   var cities = [];
          //   if (departments) {
          //     cities = _.map(departments, function (item) {
          //       return item.city
          //     });
          //   }
          //   return res.view({
          //     widget:         widget,
          //     texts:          widget.getTexts(locale),
          //     styles:         widget.getStyles(),
          //     cities:         cities,
          //     appearance:     widget.getCustomAppearance(),
          //     equipment:      widget.getCustomEquipment(),
          //     secondaryColor: helper.getWidgetColor(widget, 'color2'),
          //     textColor:      helper.getWidgetColor(widget, 'textColor'),
          //     primaryColor:   helper.getWidgetColor(widget, 'color1'),
          //     postUrl:        (widget.type && (widget.type.toLowerCase() === 'rozetka')) ? sails.config.partnerRozetka.postUrl : null,
          //     locale,
          //   });
          // })
  },

  coverimage: function (req, res) {
    var id = req.param('id');

    Widget.findOne(id).exec(function (err, widget) {
      if (err) return res.negotiate(err);
      if (!widget) return res.notFound();

      var fileAdapter  = require('skipper-disk')()
        , coverImageFd = widget.coverImageFd;

      // cover image by default
      if (!coverImageFd) coverImageFd = path.join(sails.config.appPath, 'assets/images/backgrounds/wall_1.jpg');

      // Stream the file down
      fileAdapter.read(coverImageFd)
        .on('error', function (err) {
          return res.serverError(err)
        })
        .pipe(res);
    });
  },

  calculate: function (req, res) {
    var values = req.allParams();

    calc(values, function (err, result) {
      if (err) return res.negotiate(err);
      res.ok(result);
    });
  },

  vendorCities: function (req, res) { // added to allow vendor get only his departs by bloodhound typehead;
    const id          = req.param('id');
    let allowedCities = [];
    if (req.user.isDepartment()) {
      allowedCities = _.map(req.user.departments, 'city');
    }
    Widget.getCities(id, function (err, cities) {
      if (err) return res.negotiate(err);
      if (!cities) return res.notFound();

      let result = cities;
      if (allowedCities.length) {
        result = _.intersection(allowedCities, cities)
      }

      return res.json(result);
    })
  },

  vendorDepartments: function (req, res) {
    var id   = req.param('id') // widget id
      , q    = req.param('q', false)
      , city = req.param('city', false);

    const allowedDepartments = req.user.departments;

    if (q) q = _.trim(q);
    if (city) city = _.trim(city);

    Widget.getDepartments({id, q, city}, function (err, departments) {
      if (err) return res.negotiate(err);
      if (!departments) return res.notFound();
      let result = departments;

      if (allowedDepartments.length) {
        result = _.intersectionBy(departments, allowedDepartments, (d) => d.id)
      }

      return res.json(result);
    })
  },


  cities: function (req, res) {
    var id = req.param('id');
    Widget.getCities(id, function (err, cities) {
      if (err) return res.negotiate(err);
      if (!cities) return res.notFound();

      return res.json(cities);
    })
  },

  departments: function (req, res) {
    var id   = req.param('id') // widget id
      , q    = req.param('q', false)
      , city = req.param('city', false);

    if (q) q = _.trim(q);
    // if (city) city = _.trim(city); Города по факту могут быть с пробелом

    Widget.getDepartments({id, q, city}, function (err, departments) {
      if (err) return res.negotiate(err);
      if (!departments) return res.notFound();

      return res.json(departments);
    })
  },

  brands: function (req, res) {
    const q = _.trim(req.query.q);
    const type  = req.query.type;
    const notype = req.query.notype;
    let options = {};
    if (q) {
      options.brand = {contains: q}
    }
    if (type) {
      options.type = type
    }
    if (notype) {
      options.type = {'not': notype};
    }
    options.deleted = {'not': true};
    Product.find(options).exec(function (err, products) {
      if (err) return res.negotiate(err);
      products = _.chain(products).map(function (product) {
        return product.brand;
      }).uniq().sort().value();

      return res.json(products);
    })
  },

  models: function (req, res) {
    const brand = _.trim(req.params.brand);
    const q = _.trim(req.query.q);
    const type = req.query.type;
    const options = {brand};
    if (q) {
      options.name = {contains: q}
    }
    if (type) {
      options.type = type
    }
    options.deleted = {'not': true};
    Product
      .find(options)
      .exec(function (err, products) {
        if (err) return res.negotiate(err);

        products = _.chain(products).sortBy('name').map((product) => {
          product.imageUrl = urlHelper.getProductImageUrl(product);
          product          = _.omit(product.toObject(), ['price', 'updatedAt', 'createdAt']);
          return product;
        });
        return res.json(products);
      })
  },

  products: function (req, res) {
    var id = req.param('id')
      , q  = _.trim(req.param('q'));

    Product.nameContains(q, function (err, products) {
      if (err) return res.negotiate(err);
      products = _.map(products, function (product) {
        product.imageUrl = urlHelper.getProductImageUrl(product);
        product          = _.omit(product.toObject(), ['price', 'updatedAt', 'createdAt']);
        return product;
      });
      return res.json(products);
    });
  },

  upload: function (req, res) {
    req.file('file').upload({
      dirname: path.join(sails.config.appPath, '.tmp/public/media/customer-device')
    }, function (err, uploadedFiles) {
      if (err) return res.negotiate(err);
      if (uploadedFiles.length === 0) return res.badRequest('No file was uploaded');

      var file     = uploadedFiles[0]
        , basename = path.basename(file.fd);

      res.json({
        type: file.type,
        size: file.size,
        name: basename,
        url:  urlHelper.getCustomerDeviceImageUrl(basename)
      });
    });
  }

};
