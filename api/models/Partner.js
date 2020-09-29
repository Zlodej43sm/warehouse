var S = require('string');
var _ = require('lodash');

var Partner = {

  schema: true,

  attributes: {
    title:              {type: 'string', required: true},
    widgets:            {collection: 'Widget', via: 'partner'},
    departments:        {collection: 'Department', via: 'partner'},
    appearanceRates:    {type: 'array'},
    mailOptions:        {type: 'json'},
    equipmentRates:     {type: 'array'},
    users:              {collection: 'User', via: 'partners'},
    replaceDepartments: {type: 'array'},
    isDisabled:         {type: 'boolean', required: false},
    useMap:             {type: 'boolean', required: false},
    useContract:        {type: 'boolean', required: false},
    onlyPrice:          {type: 'boolean', required: false},
    useInterval:        {type: 'boolean', required: false},
    usePrefix:          {type: 'boolean', required: false},
    roundTo:            {type: "int", required: false},
    useTv:          {type: 'boolean', required: false},
  },

  beforeValidate: function(values, cb) {
    if (!values.replaceDepartments) {
      values.replaceDepartments = void 0;
      return cb();
    }
    values.replaceDepartments = _.remove(values.replaceDepartments);
    if(values.replaceDepartments.length === 0) {
      values.replaceDepartments = void 0;
    }
    cb();
  },

  beforeCreate: function (values, cb) {
    values.isDisabled = !!values.isDisabled;
    values.useMap = !!values.useMap;
    values.onlyPrice = !!values.onlyPrice;
    values.useContract = !!values.useContract;
    values.useInterval = !!values.useInterval;
    values.usePrefix = !!values.usePrefix;
    values.useTv = !!values.useTv;
    for (var key in values) {
      if (typeof values[key] === 'string') {
        values[key] = S(values[key]).escapeHTML().s;
      }
    }
    cb();
  },

  beforeUpdate: function(values, cb) {
    values.isDisabled = !!values.isDisabled;
    values.useMap = !!values.useMap;
    values.onlyPrice = !!values.onlyPrice;
    values.useContract = !!values.useContract;
    values.useInterval = !!values.useInterval;
    values.usePrefix = !!values.usePrefix;
    values.useTv = !!values.useTv;
    cb();
  },

  beforeDestroy: function (criteria, cb) {
    this.findOne()
      .where(criteria)
      .populate('widgets')
      .populate('departments')
      .exec(function (err, partner) {
        if (err) return cb(err);
        Widget.destroy({id: _.map(partner.widgets, 'id')})
          .exec(function (err) {
            Department.destroy({id: _.map(partner.departments, 'id')})
              .exec(function (err) {
                cb();
              })
          });
      });
  },

  // Пробуем уйти от удалени и пользоваться признаком неактивности
  noDeleteButton: true,

  datatable: {
    editPathEx: '/p/{id}',
    columns:    [
      {
        data:  "title",
        title: "Title"
      },
      {
        data:  "isDisabled",
        title: "Disabled",
        defaultContent: false,
      },
    ]
  }

};

module.exports = Partner;
