var messageTmpl = [
  'diff',
  'comment',
  'customerNewOrder',
  'customerEstimatedOrder',
  'departmentNewOrder',
  'customerNewEstimateOrder',
];

var History = {

  schema: true,

  attributes: {
    messages: { type: 'array', required: true },
    user    : { model: 'User' },
    order   : { model: 'Order' },
    type    : { type: 'string', enum: messageTmpl, defaultsTo: 'comment' },
    system  : { type: 'boolean', defaultsTo: false },
    isSystem: function () {
      return this.system;
    }
  }

};

module.exports = History;
