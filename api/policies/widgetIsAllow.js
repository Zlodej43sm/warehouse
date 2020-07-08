var url = require('url');

module.exports = function(req, res, next) {
  var headers    = req.headers
  , referer      = null
  , allowedHosts = ['oblik.web', 'localhost', 'oblik.herokuapp.com'];

  if (req.param('id')) {
    Widget
      .findOne({uniqueId: req.param('id')})
      .populate('partner')
      .exec(function (err, widget) {
        if (err || !widget || !widget.partner || widget.partner.isDisabled) {
          return res.jsonx('Sorry. Calculator temorary unavailable.');
        } else {
          return next();
        }
      })
  }


  /*if (headers.referer) {
    referer = url.parse(headers.referer);
    if (allowedHosts.indexOf(referer.hostname) >= 0) {
      return next();
    }
  }


  return res.jsonx('You are not permitted to inject widget instance on your site.');*/
};
