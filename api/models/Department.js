var S = require('string');

var Department = {

  schema: true,

  // Пробуем уйти от удалени и пользоваться признаком неактивности
  // Вернули удаление, переходим на soft delete
  noDeleteButton: false,
  deletedFlag: true,
  deletedAttr: 'deletedAt',
  deletedValue: new Date(),

  attributes: {
    city      : { type: 'string', required: true },
    address   : { type: 'string', required: true },
    house   : { type: 'string', required: false },
    comment   : { type: 'string', required: false },
    partner   : { model: 'Partner', required: true },
    users     : { collection: 'User', via: 'departments' },
    isDisabled: { type: 'boolean', required: false },
    latitude: { type: 'float', required: false },
    longitude: { type: 'float', required: false },
    getFullAddress: function() {
      return this.address
      + (this.house ? ', ' + this.house : '')
      + (this.comment ? ' (' + this.comment + ')' : '');
    }
  },


  beforeCreate: function (values, cb) {
    for (var key in values) {
      if ( typeof values[key] === 'string'){
        values[key] = S(values[key].trim()).escapeHTML().s;
      }
    }

    cb();
    /* if (values.createUser && values.email) {
      registerUser({
        email: values.email,
        role: 'D',
        partners: [values.partner]
      }, function (err, user) {
        if (err) return cb(err);
        values.user = user.id;
        cb();
      })
    }
    else cb();*/
  },

  afterCreate: function(values, cb) {
    return rozetka.postOneDepartmet(values)
      .then (
        data => cb(),
        error => (console.log(error), cb())
      );
  },

  beforeUpdate: function(values, cb) {
    values.isDisabled = !!values.isDisabled;
    for (var key in values) {
      if ( typeof values[key] === 'string'){
        values[key] = values[key].trim().replace(/</g, '&lt;');
      }
    }
    cb();
  },

  afterUpdate: function(values, cb) {
    return rozetka.putOneDepartmet(values)
      .then (
        data => cb(),
        error => (console.log(error), cb())
      );
  },

  /*afterCreate: function (newDepartment, cb) {
    if (newDepartment.user) {
      User.findOne(newDepartment.user).populate('departments').exec(function (err, user) {
        if (err) return cb(err);
        user.departments.add(newDepartment.id);
        user.save(cb);
      });
    }
    else cb();
  },*/

  datatable: {
    editPathEx: '/p/{partner}/department/{id}',
    dataToggle: 'modal',
    columns: [
      {
        data: "city",
        title: "City"
      },
      {
        data: null,
        title: "Address"
      },
      {
        data: 'users',
        title: 'Users'
      },
      {
        data:  "isDisabled",
        title: "Disabled",
        defaultContent: false,
      },
      {
        data:  null,
        title: "Latitude",
      },
      {
        data:  null,
        title: "Longitude",
      },
    ],
    order: [[3, 'desc']]
  }

};

module.exports = Department;
