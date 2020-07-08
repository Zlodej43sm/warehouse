module.exports = {
  attributes : {
    num : {
      type : "integer"
    },
  },
  next : function (id, cb) {
    Sequence.native(function (err, col) {
      col.findAndModify(
        { _id: id },
        [['_id', 'asc']],
        {$inc: { num : 1 }},
        {new: true, upsert : true},
        function (err, data) { cb(err, data.value.num) }
      );
    });
  },
};