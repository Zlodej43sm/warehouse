var crypto = require('crypto');

module.exports = function registerUser (options, next) {
  var options = _.extend({
    email: null,
    username: null,
    password: null,
    role: sails.config.acl.defaultRole
  }, options);

  if (!options.email) return next(new Error('No email'));
  if (!options.username) options.username = options.email;
  if (!options.password) options.password = options.email;

  User.create(options, function (err, user) {
    if (err) return next(err);
    Passport.create({
      protocol    : 'local',
      password    : options.password,
      user        : user.id,
      accessToken : crypto.randomBytes(48).toString('base64')
    }, function (err, passport) {
      if (err) return user.destroy(function (destroyErr) {
        next(destroyErr || err);
      });
      next(null, user);
    });
  });
}
