/**
 * Passport configuration
 *
 * This is the configuration for your Passport.js setup and where you
 * define the authentication strategies you want your application to employ.
 *
 * I have tested the service with all of the providers listed below - if you
 * come across a provider that for some reason doesn't work, feel free to open
 * an issue on GitHub.
 *
 * Also, authentication scopes can be set through the `scope` property.
 *
 * For more information on the available providers, check out:
 * http://passportjs.org/guide/providers/
 */

module.exports.passport = {
  local: {
    strategy: require('passport-local').Strategy
  },

  basic: {
    strategy: require('passport-http').BasicStrategy,
    protocol: 'basic',
  },
  // bearer: {
  //   strategy: require('passport-http-bearer').Strategy
  // },

  // twitter: {
  //   name: 'Twitter',
  //   protocol: 'oauth',
  //   strategy: require('passport-twitter').Strategy,
  //   options: {
  //     consumerKey: 'your-consumer-key',
  //     consumerSecret: 'your-consumer-secret'
  //   }
  // },

  // github: {
  //   name: 'GitHub',
  //   protocol: 'oauth2',
  //   strategy: require('passport-github').Strategy,
  //   options: {
  //     clientID: 'your-client-id',
  //     clientSecret: 'your-client-secret'
  //   }
  // },

  facebook: {
    name:     'Facebook',
    protocol: 'oauth2',
    strategy: require('passport-facebook').Strategy,
    options:  {
      clientID:      '435633656634845',
      clientSecret:  'aed68df18063becdbc73d4a4c85f54de',
      profileFields: ["email", "name", "gender", "locale", "age_range", "photos", "link"]
    }
  },

  vkontakte: {
    name:     'Vkontakte',
    protocol: 'oauth2',
    strategy: require('passport-vkontakte').Strategy,
    options:  {
      clientID:      5223599,
      clientSecret:  'XEHNN9kULCUQKDvUHC3d',
      profileFields: ["email", "name", "gender", "locale", "age_range", "photos", "link"]
    }
  },

  // google: {
  //   name: 'Google',
  //   protocol: 'oauth2',
  //   strategy: require('passport-google-oauth').OAuth2Strategy,
  //   options: {
  //     clientID: 'your-client-id',
  //     clientSecret: 'your-client-secret'
  //   }
  // },

  // cas: {
  //   name: 'CAS',
  //   protocol: 'cas',
  //   strategy: require('passport-cas').Strategy,
  //   options: {
  //     ssoBaseURL: 'http://your-cas-url',
  //     serverBaseURL: 'http://localhost:1337',
  //     serviceURL: 'http://localhost:1337/auth/cas/callback'
  //   }
  // }
};
