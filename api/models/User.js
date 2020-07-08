var S = require('string')
var ObjectId = require('mongodb').ObjectID;
var _ = require('lodash');

module.exports = {
  // Enforce model schema in the case of schemaless databases
  schema: true,

  attributes: {
    username:         {type: 'string', unique: true},
    email:            {type: 'email', unique: true},
    first_name:       {type: 'string'},
    last_name:        {type: 'string'},
    role:             {type: 'string', required: true, enum: sails.config.acl.roles},
    locale:           {type: 'string', enum: sails.config.i18n.locales},
    orderVisibleTime: {type: 'integer', max: sails.config.app.orderVisibleTime.maxDays},
    passports:        {collection: 'Passport', via: 'user'},
    departments:      {collection: 'Department', via: 'users', dominant: true},
    partners:         {collection: 'Partner', via: 'users', dominant: true},

    beforeCreate: function (values, cb) {
      for (var key in values) {
        if (typeof values[key] === 'string') {
          values[key] = S(values[key]).escapeHTML().s
        }
      }
      cb();
    },

    getName:                 function () {
      var name = [this.first_name, this.last_name].join(' ').trim();
      if (!name) name = this.username;
      if (!name) name = this.email;
      return name;
    },
    getRole:                 function (locale) {
      return sails.__({phrase: 'Role ' + this.role, locale: locale || this.getLocale()});
    },
    getLocale:               function () {
      return this.locale || sails.config.i18n.defaultLocale;
    },
    isExpert:                function () {
      return this.role == 'G';
    },
    isPartner:               function () {
      return this.role == 'P';
    },
    isSuperUser:             function () {
      return this.role == 'SU';
    },
    isDepartment:            function () {
      return this.role == 'D';
    },
    isEstimator:             function () {
      return this.role == 'E';
    },
    isServiceManager:        function () {
      return this.role == 'SM';
    },
    getPartnerIds:          async function () {
      if (this.partners && this.partners.length) {
        const replaceDepartments = _.map(this.partners, function (o) {
          return o.id;
        });
        const partners = await Partner.find({replaceDepartments});
        const partnerIds = _.map(partners, function (o) {
          return o.id;
        });
        return _.concat(replaceDepartments, partnerIds);
      }
      return [];
    },
    getDepartmentIds:        function () {
      if (this.departments && this.departments.length) {
        return _.map(this.departments, function (o) {
          return o.id
        });
      }
      ;
      return [];
    },
    getOrderVisibleTime:     function () {
      return this.orderVisibleTime || sails.config.app.orderVisibleTime.default;
    },
    getCurrentPartnerObject: function () {
      if (this.isPartner() && this.partners && this.partners.length) {
        return this.partners[0];
      }
      return false;
    },
    addRoleFilterToQuery:   async function (query) {
      var dids = this.getDepartmentIds()
        , pids = await this.getPartnerIds();

      if (this.isEstimator()) {
        query.where({state: 'estimate'});
      }

      if (this.isDepartment()) {
        var offsettime = moment().add(-this.getOrderVisibleTime(), 'days').format();
        query.where({
          updatedAt: {'>': offsettime}
        })
      }

      if (pids.length && dids.length) {
        query.where({
          department: dids
          //department: {not: null},
          //or: [
          //  {partner: pids, department: dids},
          //  {department: dids}
          //]
        });
      } else {
        if (pids.length) {
          query.where({partner: pids});
        }
        if (dids.length) {
          query.where({department: dids});
        }
      }
    },
    getRoleFilterForQuery:   async function () {
      var dids = this.getDepartmentIds()
        , pids = await this.getPartnerIds()
        , filter = {};
      if (this.isEstimator()) {
        filter.state = 'estimate';
      }
      if (this.isDepartment()) {
        var offsettime = moment().add(-this.getOrderVisibleTime(), 'days').format();
        filter.updatedAt =  {'>': offsettime}
      }
      // ObjectId(item) - для нативных запросов + .concat(pids) - для waterelin
      if (pids.length) {
        filter.partner = {$in: _.map(pids, item => ObjectId(item)).concat(pids)};
      }
      // ObjectId(item) - для нативных запросов + .concat(dids) - для waterelin
      if (dids.length) {
        filter.department = {$in: _.map(dids, item => ObjectId(item)).concat(dids)};
      }
      return filter;
    },
    getPartners:             function (idx) {
      if (this.partners) {
        return idx >= 0 ? this.partners[idx] : this.partners;
      }
      return {};
    },
    getDepartments:          function (idx) {
      if (this.departments) {
        return idx >= 0 ? this.departments[idx] : this.departments;
      }
      return {};
    }
  },

  /*filterCollectionByUserPartners: function (collection, user) {
   var userPartnerId = user.partners.length ? user.partners[0].id : false
   , result        = [];

   if (!userPartnerId) return collection;

   _.each(collection, function (item) {
   if (item.getPartnerIds().indexOf(userPartnerId) >= 0) {
   result.push(item);
   }
   });

   return result;
   },*/

  /*beforeDestroy: function (criteria, cb) {
   this
   .find(criteria.where)
   .populate('passports')
   .exec(function (err, user) {
   console.log(err)
   console.log(user.passports)
   if (err) return cb(err);
   if (!user.passports) return cb();

   var ids = _.map(user.passports, function (item) { return item.id });

   console.log(ids);

   Passport.find({id: ids}).exec(function (err, passports) {
   console.log(user)
   console.log(passports)
   })
   })
   },*/

  indexes: [
    {
      attributes: {email: 1},
      options:    {unique: true}
    },
    {
      attributes: {username: 1},
      options:    {unique: true}
    }
  ],

  datatable: {
    editPathEx: '/u/{id}',
    updatedAt:  false,
    columns:    [
      {
        data:  "email",
        title: "Email"
      },
      {
        data:  "username",
        title: "Username"
      },
      {
        data:  "role",
        title: "Role"
      },
      {
        data:  "partners",
        title: "Partner"
      },
      {
        data:  "departments",
        title: "Department"
      },
      {
        data:           "isSU",
        title:          "",
        isNotDisplayed: true
      },
    ],
    filters:    {
      isSU: function () {
        return this.isSuperUser()
      },
      role: function (user) {
        return this.getRole(user.getLocale())
      }
    },
    order:      [[3, 'desc']]
  }

};
