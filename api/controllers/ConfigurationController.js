/**
 * ConfigurationController
 *
 * @description :: Server-side logic for managing configurations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  _config: {
    actions: false,
    shortcuts: false,
    rest: true
  },

  index: function (req, res) {
    res.view();
  },

};

