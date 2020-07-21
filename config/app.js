module.exports.app = {

  // Application name
  name: 'Calculate App',

  // Main navigation (left)
  nav:              [
    {
      label:      'Dashboard',
      url:        '/dashboard',
      ico:        'dashboard',
      controller: 'dashboard',
    }, {
      label:       'Partners',
      url:         '/p',
      ico:         'hand-spock-o',
      isVisibleTo: ['SU'],
      controller:  'partner'
    }, {
      label:       'Users',
      url:         '/u',
      ico:         'users',
      isVisibleTo: ['SU', 'P'],
      controller:  'user',
    },
    {
      label:       'Departments',
      url:         '/departments?callback=datatable',
      ico:         'map-marker',
      isVisibleTo: ['P'],
      controller:  'department',
    }, {
      label:       'Orders',
      url:         '/o',
      ico:         'folder-open-o',
      isVisibleTo: ['SU', 'D', 'G', 'P', 'E'],
      controller:  'order',
    }, {
      label:       'Products',
      url:         '/products',
      ico:         'shopping-bag',
      isVisibleTo: ['SU'],
      controller:  'product',
    }, {
      label:       'Configuration',
      url:         '/configuration',
      ico:         'cogs',
      isVisibleTo: ['SU'],
      controller:  'configuration',
    }
  ],
  orderVisibleTime: {
    maxDays: 100,
    default: 4
  },
  orderStates:      [
    'pending', // Предварительная заявка не содержит личных данных и выбранного отделения
    'new',
    'estimate',
    'estimated',
    'confirmed',
    'rejected',
    'autocancel',
    'complete'
  ],
  orderTypes:       [
    {
      name:   'Phone or Tablet',
      id:     'simple',
      fields: []
    },
    {
      name:   'Other',
      id:     'estimate',
      fields: [{
        name: 'device_type',
        required: true
      }, {
        name: 'device_brand',
        required: true
      }, {
        name: 'device_model',
        required: true
      }]
    },
    {
      name:   'Notebook/Computer',
      id:     'notebook',
      fields: [{
        name:     'device_type',
        value:    'Notebook',
        required: true,
        note:     'Тип устройства (ноутбук, компьютер, нетбук и т.д.)'
      }, {
        name:     'device_brand',
        required: true
      }, {
        name:     'device_model',
        required: true
      }, {
        name:     'device_proc',
        required: true
      }, {
        name:     'device_ram',
        required: true
      }, {
        name:     'device_hard',
        required: true
      }, {
        name:     'device_video',
        required: true
      }]
    }
  ],
  widget: {
    color1:    '#00c853',
    color2:    '#ffeb3b',
    textColor: '#ffffff',
    defaultWidth: 800
  },
  widgetTypes: [
    {
      value: 'default',
      name: 'Default',
    }, {
      value: 'extended',
      name: 'Extended',
    }, {
      value: 'rozetka',
      name: 'Rozetka',
    },
  ]
};
