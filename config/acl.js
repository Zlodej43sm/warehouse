module.exports.acl = {

  // Current user role access, default in session.role
  currentRole: 'session.role',

  // Default roles in application
  // 'SU' - Super User
  // 'P'  - Partner
  // 'D'  - Department
  // 'G'  - Guest(Expert)
  // 'SM' - Servoce Manager (read and comment)
  roles: ['G', 'SU', 'P', 'D', 'E', 'SM'],

  // Default policy allow or deny, if no acl was define for a route or rule this is the default behavior
  defaultPolicy: 'allow',

  // default role EXPERT
  defaultRole: 'G',

  onForbidden: function (req, res, resource) {
    req.wantsJSON ? res.status(403).json() : res.forbidden('', {requestedUrl: req.url});
    sails.log.debug('forbidden');
  },

  // Custom ACL rules if you want to check access under controller / services
  // For example you can call sails.hook.acl.isAllow('admin', 'saveFile')
  // saveFile: {
  //   roles: ['admin']
  // }
  rules: {
    // 'user-create': {
    //   roles: ['SU']
    // }
  },

  // Additional route that are not under config/routes, can be used to protect assets files, but also rest url
  // Examples:
  //
  // 'GET /user': {
  //   'roles': ['user', 'admin']
  // },
  // 'GET /user/:id' : {
  //   'roles': ['user', 'admin']
  // },
  // 'POST /user': {
  //   'roles': ['admin']
  // },
  // 'PUT /user/:id': {
  //   'roles': ['admin']
  // },
  // 'DELETE /user/:id': {
  //   'roles': ['admin']
  // },
  // '/js/admin.js': {
  //   'roles': ['admin']
  // }
  routes: {
     //'/dashboard': { roles: ['SU', 'P', 'D'] },
     //'/dashboard/': { roles: ['SU', 'P', 'D'] },

    '/partner': { roles: ['SU'] },
    'GET /partner/*': { roles: ['SU', 'P'] },
    'PUT /partner/*': { roles: ['SU'] },
    'POST /partner/*': { roles: ['SU'] },
    'DELETE /partner/*': { roles: ['SU'] },

    '/p':{ roles: ['SU'] },
    '/p/':{ roles: ['SU'] },

    '/department': { roles: ['SU', 'P'] },
    '/department/': { roles: ['SU', 'P'] },

    '/departments': { roles: ['SU', 'P'] },
    '/departments/': { roles: ['SU', 'P'] },

    '/products': { roles: ['SU'] },
    '/products/': { roles: ['SU'] },

    '/o': { roles: ['SU', 'P', 'D', 'G', 'E', 'SM'] },
    '/o/': { roles: ['SU', 'P', 'D', 'G','E', 'SM'] },

    '/u': { roles: ['SU', 'P'] },
    'GET /u/*': { roles: ['SU', 'P'] },
    'PUT /u/*': { roles: ['SU', 'P'] },
    'POST /u/*': { roles: ['SU', 'P'] },
  },

};
