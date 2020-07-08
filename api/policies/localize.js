// api/policies/localize.js


module.exports = function (req, res, next) {
  if (req.user) {
      req.setLocale(req.user.getLocale());
      return next();
  }
  next();
};
