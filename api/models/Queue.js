//var S = require('string');

var External = {

  schema: true,

  attributes: {
    partner   : { model: 'Partner', required: false },
    collection: { type: 'string', required: true },
    internalId: { type: 'string', required: false },
    externalId: { type: 'string', required: false },
    memo: { type: 'string', required: false },
  },

  indexes: [ {
    attributes: {partner: 1, collection: 1, internalId: 1, externalId: 1},
    options:    {unique: false},
  }, {
    attributes: {partner: 1, collection: 1, internalId: 1},
    options:    {unique: false},
  }, {
    attributes: {partner: 1, collection: 1, externalId: 1},
    options:    {unique: false},
  } ],

  /*beforeCreate: function (values, cb) {
    for (var key in values) {
    }
    cb();
  },*/

  noDeleteButton: true,

  datatable: {
    editPathEx: '/p/{partner}/department/{id}',
    dataToggle: 'modal',
    columns: [ {
      data: 'city',
      title: 'City',
    }, {
      data: 'address',
      title: 'Address',
    }, {
      data: 'users',
      title: 'Users',
    } ],
    order: [[3, 'desc']],
  },

};

module.exports = External;
