/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your controllers.
 * You can apply one or more policies to a given controller, or protect
 * its actions individually.
 *
 * Any policy file (e.g. `api/policies/authenticated.js`) can be accessed
 * below by its filename, minus the extension, (e.g. "authenticated")
 *
 * For more information on how policies work, see:
 * http://sailsjs.org/#!/documentation/concepts/Policies
 *
 * For more information on configuring policies, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.policies.html
 */


module.exports.policies = {
  '*': ['passport', 'sessionAuth', 'localize'],

  AuthController: {
    '*':      ['passport'],
    'login':  ['alreadyAuth'],
    'logout': true
  },

  WidgetController: {
    'instance':          ['widgetIsAllow'],
    'coverimage':        true,
    'departments':       true,
    'products':          true,
    'brands':            true,
    'models':            true,
    'order':             true,
    'vendorCities':      ['passport'],
    'vendorDepartments': ['passport'],
    'cities':            true,
    'calculate':         true,
    'upload':            true
  },

  OrderController: {
    '*': ['passport', 'sessionAuth', 'localize'],
    'create':         true,
    'customerEdit':   true,
    'customerUpdate': true,
    'apiList': ['basic'],
    'apiGetOne': ['basic'],
    'apiUpdate': ['basic']
  },

  ProductController: {
    apiList: true,
    apiRawList: ['localize'],
    apiByWidgetList: true
  },

  // DepartmentController: {
  //   '*': ['passport', 'sessionAuth', 'localize']
  //   'create': true,
  //   'find': true,
  //   'update': true
  //},

  // PartnerController: {
  //   '*': true
  // },

};
