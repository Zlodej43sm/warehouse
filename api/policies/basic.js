/*
 * Bearer Authentication Protocol
 *
 * Bearer Authentication is for authorizing API requests. Once
 * a user is created, a token is also generated for that user
 * in its passport. This token can be used to authenticate
 * API requests.
 *
 */

module.exports = function(req, res, next) {
  passport.authenticate('basic', {session: false})(req, res, next);
};

