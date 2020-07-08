const actionUtil = require('../../node_modules/sails/lib/hooks/blueprints/actionUtil');
const client = require('redis').createClient();
const url = require('url');
const crypto = require('crypto');
const randToken = require('rand-token');

/**
 * Authentication Controller
 *
 * This is merely meant as an example of how your Authentication controller
 * should look. It currently includes the minimum amount of functionality for
 * the basics of Passport.js to work.
 */
var AuthController = {
  /**
   * Render the login page
   *
   * The login form itself is just a simple HTML form:
   *
   <form role="form" action="/auth/local" method="post">
   <input type="text" name="identifier" placeholder="Username or Email">
   <input type="password" name="password" placeholder="Password">
   <button type="submit">Sign in</button>
   </form>
   *
   * You could optionally add CSRF-protection as outlined in the documentation:
   * http://sailsjs.org/#!documentation/config.csrf
   *
   * A simple example of automatically listing all available providers in a
   * Handlebars template would look like this:
   *
   {{#each providers}}
   <a href="/auth/{{slug}}" role="button">{{name}}</a>
   {{/each}}
   *
   * @param {Object} req
   * @param {Object} res
   */
  login: function(req, res) {
    var strategies = sails.config.passport,
      providers = {};

    Object.keys(strategies).forEach(function(key) {
      if (key === 'local') {
        return;
      }
      providers[key] = {
        name: strategies[key].name,
        slug: key
      };
    });

    return res.view({
      title: 'Login Page',
      providers: providers
    });
  },

  /**
   * Log out a user and return them to the homepage
   *
   * Passport exposes a logout() function on req (also aliased as logOut()) that
   * can be called from any route handler which needs to terminate a login
   * session. Invoking logout() will remove the req.user property and clear the
   * login session (if any).
   *
   * For more information on logging out users in Passport.js, check out:
   * http://passportjs.org/guide/logout/
   *
   * @param {Object} req
   * @param {Object} res
   */
  logout: function(req, res) {
    req.logout();

    // mark the user as logged out for auth purposes
    req.user = void 0;

    // delete user role from session
    delete req.session.role;

    res.redirect('/');
  },

  /**
   * Render the registration page
   *
   * Just like the login form, the registration form is just simple HTML:
   *
   <form role="form" action="/auth/local/register" method="post">
   <input type="text" name="username" placeholder="Username">
   <input type="text" name="email" placeholder="Email">
   <input type="password" name="password" placeholder="Password">
   <button type="submit">Sign up</button>
   </form>
   *
   * @param {Object} req
   * @param {Object} res
   */
  register: function(req, res) {
    res.view({
      errors: req.flash('error')
    });
  },

  recoverPassword: function(req, res) {
    res.view({
      errors: req.flash('error')
    });
  },

  changePassword: function(req, res) {
    const values = actionUtil.parseValues(req);
    client.hgetall('users', function(err, cachedUsers) {
      const email = _.findKey(cachedUsers, (value) => value === values.token);
      User.findOne({
        where: {
          email: email
        }
      }).exec(function(err, user) {
        Passport.update({
            user: user.id
          }, {
            password: values.newPassword
          })
          .exec(function(err, passport) {
            res.redirect('/');
          });
      })
    });
  },

  changePasswordView: function(req, res) {
    client.hgetall('users', function(err, result) {
      if (_.indexOf(_.values(result), req.query.token) !== -1) {
        return res.view({
          errors: req.flash('error'),
          token: req.query.token,
          locals: {
            token: req.query.token
          }
        });
      }
      return res.notFound();
    });
  },

  sendRecover: function(req, res) {
    const values = actionUtil.parseValues(req);
    User.findOne({
      where: {
        email: values.email
      }
    }).exec(function(err, user) {
      if (err || !user) {
        return res.notFound(sails.__(err ? err : 'No such a user'));
      }
      const token = randToken.generate(32);
      client.hset('users', user.email, token);
      const recoverLink = helper.getBaseUrl() + `/changePassword?token=${token}`;
      sendEmail.toUserRecoverPassword(user, recoverLink);
      res.redirect('/');
    });
  },

  changeLanguage: function(req, res) {
    const locale = req.body.locale;
    if (!locale) {
      req.negotiate('no locale passed');
    }
    User.update({
      id: req.user.id
    }, {
      locale
    }).exec(function(err, user) {
      res.send(user);
    });
  },
  /**
   * Create a third-party authentication endpoint
   *
   * @param {Object} req
   * @param {Object} res
   */
  provider: function(req, res) {
    passport.endpoint(req, res);
  },

  /**
   * Create a authentication callback endpoint
   *
   * This endpoint handles everything related to creating and verifying Pass-
   * ports and users, both locally and from third-aprty providers.
   *
   * Passport exposes a login() function on req (also aliased as logIn()) that
   * can be used to establish a login session. When the login operation
   * completes, user will be assigned to req.user.
   *
   * For more information on logging in users in Passport.js, check out:
   * http://passportjs.org/guide/login/
   *
   * @param {Object} req
   * @param {Object} res
   */
  callback: function(req, res) {
    function tryAgain(err) {
      // Only certain error messages are returned via req.flash('error', someError)
      // because we shouldn't expose internal authorization errors to the user.
      // We do return a generic error and the original request body.
      var flashError = req.flash('error')[0];
      if (err && !flashError) {
        req.flash('error', sails.__('Error.Passport.Generic'));
      } else if (flashError) {
        req.flash('error', flashError);
      }
      req.flash('form', req.body);
      // If an error was thrown, redirect the user to the
      // login, register or disconnect action initiator view.
      // These views should take care of rendering the error messages.
      var action = req.param('action');
      switch (action) {
        case 'register':
          res.redirect('/register');
          break;
        case 'disconnect':
          res.redirect('back');
          break;
        default:
          res.redirect('/login');
      }
    }

    passport.callback(req, res, function(err, user, challenges, statuses) {
      if (err || !user) {
        return tryAgain(challenges);
      }
      var query = url.parse(req.headers.referer, true).query;
      req.login(user, function(err) {
        if (err) {
          return tryAgain(err);
        }
        // Mark the session as authenticated to work with default Sails sessionAuth.js policy
        // req.session.authenticated = true; switch
        // Mark the session user role to work Sails ACL
        req.session.role = user.role;
        // Success message
        req.flash('success', sails.__('Welcome, %s!', req.user.getName()));
        // Upon successful login, send the user to the ... were req.user
        // will be available.
        res.redirect(query.requestedUrl || '/dashboard');
      });
    });
  },

  /**
   * Disconnect a passport from a user
   *
   * @param {Object} req
   * @param {Object} res
   */
  disconnect: function(req, res) {
    passport.disconnect(req, res);
  }
};

module.exports = AuthController;
