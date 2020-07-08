var S = require('string');

var Product = {

  schema: true,

  attributes: {
    name:        {type: "string"},
    type:        {type: "string"},
    brand:       {type: "string"},
    model:       {type: "string"},
    description: {type: "string"},
    price:       {type: "int", defaultsTo: 0},
    active:      {type: "boolean"}, //
    deleted:     {type: "boolean"}, //
    image:       {type: "string"}
  },

  /* Из-за этой функции могут не сравниваться наименования
     и создаваться лишние идентификаторы
  beforeCreate: function (values, cb) {
    for (var key in values) {
      if (typeof values[key] === 'string') {
        values[key] = S(values[key]).escapeHTML().s
        if (key == 'brand') {
          values[key] = values[key].replace(/&quot;/g, '"');
        }
      }
    }
    cb();
  },*/

  noDeleteButton: true,

  datatable: {
    columns: [
      {
        data:  null,
        title: "Image",
        width: 100
      },
      {
        data:  "name",
        title: "Name"
      },
      {
        data:       "price",
        title:      "Price",
        searchable: false
      }
    ],
    filters: {
      price: function () {
        return helper.getPriceCoeff() * this.price;
      }
    },
    order:   [[1, 'asc']]
  }

};

module.exports = Product;
