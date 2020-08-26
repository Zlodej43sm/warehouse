const actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');
const jade       = require('jade');
const pdf        = require('html-pdf');

module.exports = {

  _config: {
    actions:   false,
    shortcuts: false,
    rest:      true
  },

  list: function (req, res) {
    return res.view();
  },

  widgetStyles: function (req, res) {
    var id = req.param('id')
    Widget
      .findOne({uniqueId: id})
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });
        res.view({
          widget: widget,
          styles: widget.getStyles(),
        })
      })
  },

  updateWidgetStyles: function (req, res) {
    const id = req.param('id');

    if (req.param('_restore')) {
      return Widget.update(id, {styles: null})
        .exec(function (err, widget) {
          if (err) return res.serverError(err);
          res.redirect(req.headers.referer);
        })
    }

    const styles = actionUtil.parseValues(req).styles;
    const values = {styles: styles};

    Widget.update(id, values)
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        res.redirect(req.headers.referer);
      })
  },

  widgetContent:       function (req, res) {
    const id = req.param('id'); // uniqueId

    Widget
      .findOne({uniqueId: id})
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });
        res.view({
          widget: widget,
          texts:  widget.getTexts(),
        })
      })
  },

  contractEditView:    function (req, res) {
    const id = req.param('id'); // uniqueId
    Widget
      .findOne({uniqueId: id})
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });

        res.render('contract/edit', {widget});
      })
  },

  contractPreview:    function (req, res) {
    const id = req.param('widgetId'); // uniqueId
    Widget
      .findOne(id)
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });

        const contract = widget.getContract();
        const options = {"format": "Letter"};
        pdf.create(contract, options).toStream(function (err, stream) {
          stream.pipe(res);
        });
      })
  },
  contractRestore:     function (req, res) {
    const id = req.param('widgetId');

    return Widget.update(id, {contract: null}) .exec(function (err, widget) {
      if (err) return res.serverError(err);
      res.redirect(req.headers.referer);
    })
  },
  contractUpdate:      function (req, res) {
    const id = req.param('widgetId');
    const values = {contract: req.body};
    Widget.update(id, values)
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        res.send(values);
      })
  },
  contractText:        function (req, res) {
    const id = req.param('id'); // uniqueId
    Widget
      .findOne({uniqueId: id})
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        if (!widget) return res.view('widget/404', {
          errorMsg: 'No widget found with the same unique id #' + id
        });

        const contract = widget.getContract();
        res.send({contract, texts: widget.getContractTexts()});
      })
  },

  updateWidgetContent: function (req, res) {
    const id = req.param('id');

    if (req.param('_restore')) {
      return Widget.update(id, {content: null})
        .exec(function (err, widget) {
          if (err) return res.serverError(err);
          res.redirect(req.headers.referer);
        })
    }

    const content = _.omit(actionUtil.parseValues(req), ['id']);
    const values  = {content: content};

    Widget.update(id, values)
      .exec(function (err, widget) {
        if (err) return res.serverError(err);
        res.redirect(req.headers.referer);
      })
  },

  edit: function (req, res) {
    var id = req.param('id');

    async.waterfall([
        function (callback) {
          Partner
            .find()
            .where({id: {not: id}})
            .exec(function (err, partners) {
              if (err) return callback(err);
              callback(null, partners);
            });
        },
        function (partners, callback) {
          Partner
            .findOne(id)
            .populate('widgets', {sort: 'updatedAt DESC'})
            .exec(function (err, partner) {
              if (err) return callback(err);
              if (!partner) return res.notFound('No record found with the specified `id`.');
              callback(null, partners, partner);
            });
        }
      ],
      function (err, partners, partner) {
        if (err) return res.negotiate(err);
        res.view({
          partner:  partner || {},
          partners: partners || {},
          emails:   _.keys(_.omit(sendEmail, ['identity', 'globalId', 'sails', 'toUserRecoverPassword'])) || [],
        });
      });
  },

  update: function (req, res) {
    var pk         = actionUtil.requirePk(req)
      , values     = actionUtil.parseValues(req)
      , redirectTo = req.param('_sace') ? req.headers.referer : '/p';

    values.appearanceRates = _.map(values.appearanceRates, function (val) {
      return val.replace(',', '.');
    });

    values.equipmentRates = _.map(values.equipmentRates, function (val) {
      return val.replace(',', '.');
    })

    try {
      values.mailOptions = JSON.parse(values.allMailsData)
    } catch (error) {
      console.log(error);
    }

    Partner.update(pk, values).exec(function (err, matchingRecords) {
      if (err) return res.negotiate(err);
      return res.redirect(redirectTo);
    });
  },

  getMailSettings: function (req, res) {
    var pk                = actionUtil.requirePk(req);
    var mailType          = req.param('mailType');
    var defaultMailConfig = sails.config.email.defaultMailContent;
    Partner
      .findOne(pk).exec(function (err, partner) {
      res.send(_.extend(defaultMailConfig[mailType], partner.mailOptions ? partner.mailOptions[mailType] : {}))
    })
  },

  editDepartment: function (req, res) {
    var id  = req.param('id')
      , did = req.param('did');

    Department.findOne(did).populate('partner').exec(function (err, matchingRecord) {
      if (err) return res.serverError(err);
      if (!matchingRecord) return res.notFound('No record found with the specified `id`.');

      res.view('partner/department', {
        department: matchingRecord,
      });
    });
  },

  widget: function (req, res) {
    var id  = req.param('id')
      , wid = req.param('wid');

    if (!wid) {
      return res.view('partner/new/widget', {
        widget:        {},
        partnerId:     id,
        formActionUrl: '/widget'
      });
    }

    Widget.findOne(wid).exec(function (err, matchingRecord) {
      if (err) return res.serverError(err);
      if (!matchingRecord) return res.notFound('No record found with the specified `id`.');

      res.view('partner/new/widget', {
        widget:        matchingRecord,
        partnerId:     id,
        formActionUrl: strformat('/widget/{id}', matchingRecord),
        isUpdate:      true
      });
    });
  },

  departments: function (req, res) {
    var id          = req.param('id') // partner id
      , isDatatable = req.param('callback') == 'datatable';

    Department
      .find()
      .where({partner: id})
      .sort({city: 'ASC', address: 'ASC'})
      .populate('users')
      .exec(function (err, matchingRecords) {
        if (err) return res.serverError(err);
        if (!matchingRecords) return res.notFound('No record found with the specified `id`.');

        if (isDatatable) return datatable.sendOk(res, Department, matchingRecords, req.user);
        else return res.json(matchingRecords);
      })
  }

};
