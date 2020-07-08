module.exports = {

  index: function (req, res) {
    /*return res.view('startpage');*/
    res.redirect('/login');
  },

};