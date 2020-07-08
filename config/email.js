const  fs = require('fs');
const  path = require('path');
const  _ = require('lodash');

const customConfig = JSON.parse(fs.readFileSync(path.join(__dirname, './emailConfig.json')).toString());

const defaultConfig = {
  testMode:           false,
  from:               'no-reply@example.com',
  templateDir:        'views/templates/email',
  defaultMailContent: {
    toCustomerNewOrder:          {
      subject:   'Ваша заявка принята',
      from:      'no-reply2@example.com',
      signature: 'С уважением, Команда Calculate calculate@mail.net'
    },
    toEstimatorNewEstimateOrder: {
      subject:   'Поступила заявка',
      from:      'no-reply2@example.com',
      signature: 'С уважением, Команда Calculate calculate@mail.net'
    },
    toCustomerAnEstimatedOrder:  {
      subject:   'Мы рассчитали стоимость устройства',
      from:      'no-reply2@example.com',
      signature: 'С уважением, Команда Calculate calculate@mail.net'
    },
    toCustomerNewEstimateOrder:  {
      subject:   'Заявка принята на просчёт',
      from:      'no-reply2@example.com',
      signature: 'С уважением, Команда Calculate calculate@mail.net'
    },
    toDepartmentUserNewOrder:    {
      subject:   'Новая заявка',
      from:      'no-reply2@example.com',
      signature: 'С уважением, Команда Calculate calculate@mail.net'
    },
  }
};

module.exports.email = _.extend(defaultConfig, customConfig);
