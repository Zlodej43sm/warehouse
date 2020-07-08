module.exports = {

  _config: {
    actions: false,
    shortcuts: false,
    rest: true
  },

  list: function (req, res) {
    res.view({
     partner: req.user.partners[0]
    })
  }


};
