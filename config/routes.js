/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#!/documentation/concepts/Routes/RouteTargetSyntax.html
 */

module.exports.routes = {

  'all /department/*': function (req, res, next) {
    // перевод параметра form input checkbox (undefined | "1") в булев тип
    req.body.isDisabled = !!req.body.isDisabled;
    return next();
   },

  // AuthController
  //'/*':                    function (req, res, next) {
  //  //if (req.method === 'PUT' || req.method === 'POST') {
  //  console.log(req.method + ': ' + req.originalUrl);
  //  //}
  //
  //  next()
  //},
  'get /login':            'auth.login',
  'get /recoverPassword':  'auth.recoverPassword',
  'post /recoverPassword': 'auth.sendRecover',
  'post /changeLanguage':  'auth.changeLanguage',
  'get /changePassword':   'auth.changePasswordView',
  'post /changePassword':  'auth.changePassword',
  'get /logout':           'auth.logout',
  'get /register':         'auth.register',

  'post /auth/local':             'auth.callback',
  'post /auth/local/:action':     'auth.callback',
  'get /auth/:provider':          'auth.provider',
  'get /auth/:provider/callback': 'auth.callback',
  'get /auth/:provider/:action':  'auth.callback',

  // Others
  'get /': 'index',

  // Departments
  'get /departments': 'department.list',

  // PartnerController
  'get /p':                       'partner.list',
  'get /p/:id':                   'partner.edit',
  'post /p/:id':                  'partner.update',
  'post /p/:id/mailSettings':     'partner.updateMailSettings',
  'get /p/:id/widget/:wid?':      'partner.widget',
  'get /p/:id/department/:did?':  'partner.editDepartment',
  'get /partner/:id/departments': 'partner.departments',
  'get /p/:id/:mailType':         'partner.getMailSettings',
  'post /widgetContent/:id':      'partner.updateWidgetContent', // doesn't work with put (no idea's why)
  'get /widgetContent/:id':       'partner.widgetContent',

  'get /widgetContractEdit/:id':      'partner.contractEditView',
  'get /widgetContractText/:id':      'partner.contractText',
  'get /contract/:widgetId':          'partner.contractPreview',
  'post /contract/restore/:widgetId': 'partner.contractRestore',
  'put /contract/:widgetId':          'partner.contractUpdate',

  'get /widgetStyles/:id':  'partner.widgetStyles',
  'post /widgetStyles/:id': 'partner.updateWidgetStyles',

  // UserController
  'get /u':                    'user.list',
  'get /user/new':             'user.new',
  'get /user/find':            'user.find',
  'get /u/:id':                'user.edit',
  'post /user':                'user.create',
  'post /user/:id':            'user.update',
  'delete /user/:id':          'user.destroy',
  'post /user/changepswd/:id': 'user.changepswd',

  // OrderController
  'get /o':                     'order.list',
  'get /o/:id':                 'order.edit',
  'post /o/create':             'order.create',
  'post /o/:id':                'order.update',
  'get /o/:id/contract':        'order.contract',
  'get /o/:id/contract/fields': 'order.contractFields',
  'put /o/:id/fields':          'order.editContractFields',
  'put /o/reject/:id':          'order.reject',
  'put /o/restore/:id':         'order.restore',
  'get /order/datatable':      'order.datatable',
  'post /order/upload':         'order.upload',
  'get /order/find':            'order.find',
  'get /order/new':             'order.new',
  'post /order/create':         'order.create',
  'get /order/export':          'order.export',
  'get /order/:id':             'order.customerEdit',
  'put /order/:id':             'order.customerUpdate',
  'delete /order/:id':          'order.destroy',

  // WidgetController
  'post /widget':                       'widget.create',
  'post /widget/order':                 'order.create',
  'post /widget/:id/calculate':         'widget.calculate',
  'get /widget/coverimage':             'widget.coverimage',
  'get /widget/:id/products':           'widget.products',
  'get /widget/brands':                 'widget.brands',
  'get /widget/models/:brand':          'widget.models',
  'get /widget/:id/cities':             'widget.cities',
  'get /widget/:id/vendor/cities':      'widget.vendorCities',
  'get /widget/:id/vendor/departments': 'widget.vendorDepartments',
  'get /widget/:id/departments':        'widget.departments',
  'post /widget/:id/upload':            'widget.upload',
  'get /widget/:id':                    'widget.instance',
  'put /widget/:id':                    'widget.update',
  'delete /widget/:id':                 'widget.destroy',

  // ProductController
  'get /products':         'product.list',
  'get /products/sync':    'product.sync',
  'get /products/restore': 'product.restore',

  'get /api/products':     'product.apiList',
  'get /api/products/raw': 'product.apiRawList',
  'get /api/products/:widget': 'product.apiByWidgetList',
  'get /api/orders':       'order.apiList',          // vendor orders list
  'get /api/order/:id':    'order.apiGetOne',        // detailed order description
  'post /api/order/:id':   'order.apiUpdate',        // order update
  //'post /api/order/upload': 'order.ApiUploadPhoto',   // order upload photo

};
