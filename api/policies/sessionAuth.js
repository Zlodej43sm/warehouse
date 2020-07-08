/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function(req, res, next) {
  // User is allowed, proceed to the next policy,
  // or if this is the last policy, the controller
  if (req.user) {
    return next();
  } else {
    delete req.session.role;
    delete req.session.user;
    delete req.session.authenticated;
    delete req.user
  }
  res.redirect('/login');
  next(new Error('Error.Parthner.Disabled'));
  // User is not allowed
  // (default res.forbidden() behavior can be overridden in `config/403.js`)
  // return res.forbidden('You are not permitted to perform this action.', {requestedUrl: req.url});
};
