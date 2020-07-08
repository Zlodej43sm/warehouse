var actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');

module.exports = {

  _config: {
    actions: false,
    shortcuts: false,
    rest: false
  },

  list: function(req, res) {
    return res.view();
  },

  find: function (req, res) {
    var user = req.user;

    User.findOne(user.id)
    .populate('partners')
    .populate('departments')
    .exec(function (err, user) {
      if (err) return res.negotiate(err);

      User
      .find()
      .populate('partners')
      .populate('departments')
      .exec(async function (err, collection) {
        if (err) return res.negotiate(err);
        if(!collection) return res.notFound('No record found with the specified `id`.');

        // only for partner's
        // when user have partners associations
        if (user.isPartner() && user.partners && user.partners.length) {
          let partners =  await user.getPartnerIds();
          let partnerId = partners[0];
          collection = _.filter(collection, function (item) {
            return _.some(item.partners, { 'id': partnerId })
              && (item.isPartner() || item.isDepartment());
          });
        }
        // END

        return datatable.sendOk(res, User, collection, req.user);
      })
    });
  },

  new: function (req, res) { // TODO: requires refactoring
    var user = req.user;

    User.findOne(user.id)
    .populate('partners')
    .populate('departments')
    .exec(function (err, user) {
      if (err) return res.negotiate(err);

      var viewOptions = {
        theUser: {},
        partners: [],
        currentPartner: user.getCurrentPartnerObject(),
        currentOrderVisibleTime: user.getOrderVisibleTime(),
        orderVisibleTime: sails.config.app.orderVisibleTime,
        roles: helper.getAllowToCreateUserRoles(user),
        isNew: true,
        title: 'Новый пользователь',
        form: {
          action: '/user',
          method: 'post',
          id: 'user-create'
        }
      };

      if (viewOptions.currentPartner) {
        return res.view('user/edit', viewOptions);
      }

      Partner.find().exec(function (err, partners) {
        if (err) return res.negotiate(err);
        viewOptions.partners = partners;
        return res.view('user/edit', viewOptions);
      });
    })
  },

  edit: function (req, res) { // TODO: requires refactoring
    var editableUserId = req.param('id', false);
    var user = req.user;

    User.findOne(user.id)
    .populate('partners')
    .populate('departments')
    .exec(function (err, user) {
      if (err) return res.negotiate(err);

      User.findOne(editableUserId).populateAll().exec(function (err, theUser) {
        if (err) return res.negotiate(err);
        if(!theUser) return res.notFound('No record found with the specified `id`.');

        var viewOptions = {
          theUser: theUser,
          partners: [],
          currentPartner: user.getCurrentPartnerObject(),
          userDepartments: _.map(theUser.departments, function (o) { return o.id }),
          title: 'Редактирование пользователя',
          roles: helper.getAllowToCreateUserRoles(user),
          currentOrderVisibleTime: theUser.getOrderVisibleTime(),
          orderVisibleTime: sails.config.app.orderVisibleTime,
          form: {
            action: strformat('/user/{id}', theUser),
            method: 'post',
            id: 'user-update'
          }
        };

        if (viewOptions.currentPartner) {
          return res.view('user/edit', viewOptions);
        }

        Partner.find().exec(function (err, partners) {
          if (err) return res.negotiate(err);
          viewOptions.partners = partners;
          return res.view('user/edit', viewOptions);
        });
      });

    });
  },

  create: function (req, res) {
    var values = actionUtil.parseValues(req);

    if (_.isArray(values.partners) && values.role == 'P') {
      values.partners = values.partners.pop();
    }

    registerUser(values, function (err, user) {
      if (err) return res.negotiate(err);
      res.json({
        user: user,
        redirectUrl: strformat('/u/{id}', user)
      });
    });
  },

  update: function (req, res) {
    var pk         = actionUtil.requirePk(req)
      , values     = actionUtil.parseValues(req)
      , redirectTo = req.param('_sace') ? req.headers.referer : '/u';

    User.update(pk, values).exec(function (err, updatedRecords) {
      if (err) return res.negotiate(err);
      return res.redirect(redirectTo);
    });
  },

  destroy: function (req, res) {
    var pk         = actionUtil.requirePk(req)
    if(!req.user.isSuperUser()) return res.forbidden();

    User.findOne(pk).exec(function (err, user) {
      if (err) return res.negotiate(err);
      if (user.isSuperUser()) return res.status(403).send('Can\'t delete administrator');
      if (!user) return res.notFound('No record found with the specified `id`.');
      user.destroy(function (destroyErr) {
        if (destroyErr) return res.negotiate(destroyErr); // TODO: delete passport and active sessions after user destroyed
        return res.send();
      });
    });
  },

  changepswd: function (req, res) {
    var uId    = actionUtil.requirePk(req)
      , values = actionUtil.parseValues(req);

    Passport.findOne({
      protocol : 'local',
      user     : uId
    }, function (err, passport) {
      if (err) return res.negotiate(err);
      if (!passport) return res.ok({
        flash: {
          message: req.__('Something went wrong'),
          type: 'error'
        }
      });
      Passport
      .update(passport.id, { password: values.password })
      .exec(function (err, updatedRecords) {
        if (err) return res.negotiate(err);
        res.ok({
          flash: {
            message: req.__('Password successfully changed'),
            type: 'success'
          }
        })
      })
    });
  },

};
