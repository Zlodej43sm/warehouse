const crypto = require('crypto');
const S      = require('string');
const fs     = require('fs');
const path   = require('path');
const jade   = require('jade');


module.exports = {

  schema: true,

  attributes: {
    description:        {type: 'string'},
    header:             {type: 'string'},
    width:              {type: 'integer', max: 1920, min: 320},
    priceCoeff:         {type: 'float', min: 0},
    coverImageFd:       {type: 'string'},
    color1:             {type: 'string'},
    color2:             {type: 'string'},
    textColor:          {type: 'string'},
    content:            {type: 'json'},
    styles:             {type: 'string'},
    uniqueId:           {type: 'string', defaultsTo: ''},
    partner:            {model: 'Partner'},
    contract:           {type: 'json'},
    type:               {type: 'string'},
    postUrl:            {type: 'string'},
    getTexts (locale) {
      if (['ru', 'ua'].indexOf(locale) < 0) {
        locale = 'ru'
      }
      return _.extend({}, Widget.defaultTexts[locale], this.content);
    },
    getContract (order) {
      const options = {};
      options.contractFields = order ? order.getContractFields() : Order.fieldsForMobileContract;
      options.texts             = this.getContractTexts();
      const defaultContractFile = path.resolve(__dirname, '../../views/contract.jade');
      return jade.renderFile(defaultContractFile, options);
    },
    getContractTexts() {
      return _.extend({}, Widget.defaultContractTexts, this.contract);
    },
    getCustomAppearance(){
      if (!this.content) {
        return helper.appearance
      }

      var appearance = {};
      _.each(helper.appearance, (app, key)=> {
        app.description = this.content[`appearanceDescription${key}`] || app.description;
        app.state       = this.content[`appearanceState${key}`] || app.state;
        appearance[key] = app;
      });

      return appearance;
    },
    getStyles:          function () {
      return this.styles || '';
    },
    getCustomEquipment: function () {
      if (!this.content) {
        return helper.equipment
      }
      var equipment = {};
      _.each(helper.equipment, (equip, key)=> {
        equip.description = this.content[`equipmentDescription${key}`] || equip.description;
        equip.state       = this.content[`equipmentState${key}`] || equip.state;
        equipment[key]    = equip;
      })
      return equipment;
    },
  },

  getCities (widgetId, cb) {
    Widget
      .findOne(widgetId)
      .populate('partner')
      .exec(function (err, widget) {
        if (err) cb(err);
        if (!widget) cb(null, null);

        // replace partner departments (cities)
        var partnerId = widget.partner.replaceDepartments
          ? widget.partner.replaceDepartments
          : widget.partner.id;

        Department
          .find({partner: partnerId})
          .sort({city: 'ASC'})
          .exec(function (err, departments) {
            if (err) cb(err);
            if (!departments) cb(null, null);

            var cities = _.uniqBy(departments, 'city');
            cities     = _.map(cities, function (item) {
              return item.city
            });
            cb(null, cities);
          });
      });
  },
  getDepartments({id, q, city}, cb){
    Widget
      .findOne(id)
      .populate('partner')
      .exec(function (err, widget) {
        if (err) return cb(err);
        if (!widget) return cb(null, null);

        // replace partner departments (cities)
        var partnerId = widget.partner.replaceDepartments
          ? widget.partner.replaceDepartments
          : widget.partner.id
          , query = Department.find().where({
              partner: partnerId,
              isDisabled: {
                $in: [false, undefined]
              }
            });

        if (q) query.where({address: {contains: q}});
        if (city) query.where({city: city});

        query.sort({address: 'ASC'}).exec(function (err, departments) {
          if (err) return cb(err);
          if (!widget) return cb(null, null);

          cb(null, departments);
        });
      });
  },
  beforeCreate: function (values, cb) {
    for (var key in values) {
      if (typeof values[key] === 'string') {
        values[key] = S(values[key]).escapeHTML().s
      }
    }
    var salt, hash;

    if (!values.partner) return cb();

    salt = new Date().getTime().toString();
    hash = crypto.createHmac('md5', salt)
      .update(values.partner)
      .digest("hex");

    values.uniqueId = hash.slice(0, 6);
    cb();
  },

  beforeDestroy: function (criteria, cb) {
    this.findOne(criteria).exec(function (err, widget) {
      Order.destroy({where: {widget: widget.id}})
        .exec(function (err) {
          if (err) return cb(err);
          cb();
        })
    })
  },
  datatable:     {
    editPathEx: '/p/{partner}/widget/{id}',
    dataToggle: 'modal',
    columns:    [
      {
        data:       'coverImageFd',
        title:      'Cover Image',
        width:      100,
        searchable: false,
        orderable:  false
      },
      {
        data:  'uniqueId',
        title: 'Unique ID'
      },
      {
        data:  'description',
        title: 'Description'
      }
    ],
    filters:    {
      coverImageFd: function () {
        return helper.getWidgetCoverUrl(this);
      }
    },
    order:      [[3, "desc"]]
  },

  defaultTexts: {
    ru: {
      /*steps*/
      step1text: "Тип устройства",
      step2text: "Модель",
      step3text: "Состояние",
      step4text: "Комплектация",
      step5text: "Расчет",
      step6text: "Заявка",

      /* first tab*/
      firstTab:                          "Телефон, планшет",
      secondTab:                         "Другое устройство",
      /* second tab simple*/
      inputSimpleBrandPlaceHolder:            "Выберите бренд",
      inputSimpleModelPlaceHolder:            "Выберите модель",
      /* second tab estimate*/
      inputDeviceTypePlaceHolder:        "Тип техники",
      inputDeviceTypeTooltip:            "Например телевизор или ноутбук",
      inputBrandPlaceHolder:             "Бренд",
      inputBrandTooltip:                 "Например Samsung, Philips, Sony",
      inputModelPlaceHolder:             "Модель",
      inputModelTooltip:                 "Например U38N, OE341A",
      checkButtonComputerNotebook:       "У меня компьютер/ноутбук",
      checkButtonTv:                     "У меня телевизор",
      inputNotebookProcessorPlaceHolder: "Процессор",
      inputNotebookProcessorTooltip:     "Например Intel i5",
      inputNotebookRAMPlaceHolder:       "Объём оперативной памяти",
      inputNotebookRAMTooltip:           "Например 4гб",
      inputNotebookHardDrivePlaceHolder: "Объём жесткого диска",
      inputNotebookHardDriveTooltip:     "Например 500гб",
      inputNotebookVideoPlaceHolder:     "Видеокарта",
      inputNotebookVideoTooltip:         "Например GeForce 1080",
      modelPhotoUploaderPlaceHolder:     "Добавьте или перетащите фото устройста",
      /*appearance */
      appearance: {
          1: {
            description: 'Устройство с явными дефектами корпуса, наличие дефектов на дисплее: пятна (белые, желтые, зеленые), засветы, битые пиксели, трещины и сколы. Множественные глубокие царапины, хорошо заметные вмятины, явные следы падения, отсутствие деталей, но при этом основные узлы полностью работоспособны.',
            state:       'Очень активно эксплуатировался, но еще каким то "загадочным" образом работоспособен (хлам, но обязательно рабочий!).',
          },
          2: {
            description: 'Устройство с активными следами эксплуатации. Возможны незначительные трещинки корпуса, сильные потертости, единичные глубокие царапины, незначительные следы падений. Наличие не более двух битых пикселей.',
            state:       'Хорошо "потасканный", но еще можно пользоваться не один месяц.',
          },
          3: {
            description: 'Устройство с незначительными следами использования. Возможны не глубокие царапины на корпусе, незначительные потертости на дисплее, затертые углы, но не следы падений.',
            state:       '"Явно Б/У, но состояние хорошее, как будто сам аккуратно пользовался".',
          },
          4: {
            description: 'Устройство в отличном состоянии, почти новое. Возможны незначительные микроцарапины на задней крышке. Недопустимо наличие повреждений на дисплее, следов падения и прочих дефектов.',
            state:       '"Я купил бы в таком состоянии в магазине, как новый, но просил бы хорошую скидку".',
          },
          5: {
            description: 'Новое устройство, в идеальном состоянии, без малейших дефектов. Наличие любых потертостей, царапин, сколов, пятен, вмятин и прочих дефектов не допустимо. Наличие фискального чека с датой, не позднее чем 6 месяцев от дня приобретения данного устройства.',
            state:       '"Купил бы как новый товар в магазине".',
          }
      },
      equipment: {
        1: {
          description: 'Комплект отсутствует. В наличии только устройство.',
          state:       'Требуется приобретение комплектующих (З/У, аккумулятор, лезвия и др.)',
        },
        2: {
          description: 'В наличии только зарядное устройство.',
          state:       'Изделие и зарядное устройство.',
        },
        3: {
          description: 'В наличии: зарядное устройство, заводская упаковка, документы (возможно отсутствие документов).',
          state:       'Есть все для нормальной эксплуатации, нет документов.',
        },
        4: {
          description: 'Полный комплект который гарантирует производитель.',
          state:       'Есть упаковка и все для нормальной эксплуатации.',
        },
        5: {
          description: 'Полный комплект который гарантирует производитель. Обязательно наличие гарантийного талона и чека о покупке.',
          state:       'Как у нового в магазине.',
        }
      },

      calculateAppearance: "Состояние",
      calculateEquipment:  "Комплект",

      successThanksForOrder:      "Спасибо за заявку",
      successWaitForYouOnAddress: "Ждем Вас по адресу:",
      successSimpleText:          "Просчет является предварительным. Окончательная стоимость будет озвучена нашим специалистом " +
                                  "после проверки устройства на работоспособность и соответствие заявленным оценкам комплектации и внешнего вида.",
      successEstimateText:        "Предварительный расчет в ближайшее время будет отправлен на Ваш электронный адрес. " +
                                  "Окончательная стоимость будет озвучена нашим специалистом после " +
                                  "проверки устройства на работоспособность и соответствие заявленным оценкам комплектации и внешнего вида.",
      successBackToSite:          "следующая заявка",

      customerFormDescriptionText:             "Оставьте свои даные, для того, чтобы мы могли связаться с вами, для дальнейшего сотрудничества",
      customerFullNamePlaceHolder:             "ФИО",
      customerPhoneNumberPlaceHolder:          "Номер телефона",
      customerEmailPlaceHolder:                "E-mail",
      customerCityPlaceHolder:                 "Город",
      customerDepartmentPlaceHolder:           "Адрес отделения",
      customerAgreePersonalDataUsePlaceHolder: "Я согласен на использование персональных данных",

      customerEditHeader:             "Точка оформления",
      customerEditPhoneNumber:        "Номер телефона",
      customerEditState:              "Состояние",
      customerEditEquipment:          "Комплект",
      customerEditInitials:           "ФИО",
      customerEditSuccessButtonValue: "Отправить",
      customerEditDepartmentAddress:  "Адрес отделения",

      mainNextButton:   "Далее",
      mainBackButton:   "Назад",
      mainFinishButton: "Оформить",
      orderFinishButton: "В корзину",

      validatorMessageRequired:   "Необходимо заполнить",
      validatorMessageEmail:      "Введите корректный e-mail",
      validatorMessageAppearance: 'Пожалуйста оцените внешний вид',
      validatorMessageEquipment:  'Пожалуйста оцените комплектацию',

      from: "от",
      to: "до",
    },  ua: {
      /*steps*/
      step1text: "Тип прилада",
      step2text: "Модель",
      step3text: "Стан",
      step4text: "Комплектація",
      step5text: "Розрахунок",
      step6text: "Заявка",

      /* first tab*/
      firstTab:                          "Телефон, планшет",
      secondTab:                         "Інший прилад",
      /* second tab simple*/
      inputSimpleBrandPlaceHolder:            "Оберіть бренд",
      inputSimpleModelPlaceHolder:            "Оберіть модель",
      /* second tab estimate*/
      inputDeviceTypePlaceHolder:        "Тип прилада",
      inputDeviceTypeTooltip:            "Наприклад телевизор чи ноутбук",
      inputBrandPlaceHolder:             "Бренд",
      inputBrandTooltip:                 "Наприклад Samsung, Philips, Sony",
      inputModelPlaceHolder:             "Модель",
      inputModelTooltip:                 "Наприклад U38N, OE341A",
      checkButtonComputerNotebook:       "Маю компьютер/ноутбук",
      checkButtonTv:                     "Маю телевізор",
      inputNotebookProcessorPlaceHolder: "Процесор",
      inputNotebookProcessorTooltip:     "Нанриклад Intel i5",
      inputNotebookRAMPlaceHolder:       "Об'єм оперативної пам'яті",
      inputNotebookRAMTooltip:           "Наприклад 4гб",
      inputNotebookHardDrivePlaceHolder: "Об'єм вінчестера",
      inputNotebookHardDriveTooltip:     "Наприклад 500гб",
      inputNotebookVideoPlaceHolder:     "Відеокарта",
      inputNotebookVideoTooltip:         "Наприклад GeForce 1080",
      modelPhotoUploaderPlaceHolder:     "Додайте чи перетягніть фото приладу",
      /*appearance */
      appearance: {
          1: {
            description: 'Пристрій з явними дефектами корпусу, наявність дефектів на дисплеї: плями (білі, жовті, зелені), засвітки, биті пікселі, тріщини і відколи. Множинні глибокі подряпини, добре помітні вмʼятини, явні сліди падіння, відсутність деталей, але при цьому основні вузли повністю працездатні.',
            state:       'Дуже активно експлуатувався, але ще якимось "загадковим" чином працездатний (мотлох, але обов\'язково робочий!).',
          },
          2: {
            description: 'Пристрій з активними слідами експлуатації. Можливі незначні тріщини корпусу, сильні потертості, поодинокі глибокі подряпини, незначні сліди падінь. Наявність не більше двох битих пікселів.',
            state:       'Добре "поюзаний", але ще можна користуватися не один місяць.',
          },
          3: {
            description: 'Пристрій з незначними слідами використання. Можливі не глибокі подряпини на корпусі, незначні потертості на дисплеї, затерті кути, але не сліди падінь.',
            state:       '"Явно Second Hand, але стан добрий, як ніби сам акуратно користувався".',
          },
          4: {
            description: 'Пристрій у відмінному стані, майже новий. Можливі незначні мікроподряпини на задній кришці. Неприпустимо наявність пошкоджень на дисплеї, слідів падіння і інших дефектів.',
            state:       '"Я купив би в такому стані в магазині, як новий, але просив би хорошу знижку".',
          },
          5: {
            description: 'Новий пристрій, в ідеальному стані, без найменших дефектів. Наявність будь-яких потертостей, подряпин, відколів, плям, вмʼятин та інших дефектів не допустимо. Наявність касового чека з датою, не пізніше ніж 6 місяців від дня придбання даного пристрою.',
            state:       '"Купив би як новий товар в магазині".',
          }
      },
      equipment: {
        1: {
          description: 'Комплекту нема. В наявності тільки пристрій.',
          state:       'Потрібно придбання комплектуючих (З / У, акумулятор, леза та ін.)',
        },
        2: {
          description: 'В наявності тільки зарядний пристрій',
          state:       'Виріб і зарядний пристрій.',
        },
        3: {
          description: 'В наявності: зарядний пристрій, заводська упаковка, документи (можливо відсутність документів).',
          state:       'Є все для нормальної експлуатації, нема документів.',
        },
        4: {
          description: 'Повний комплект який гарантує виробник.',
          state:       'Є упаковка і все для нормальної експлуатації.',
        },
        5: {
          description: 'Повний комплект який гарантує виробник. Обовʼязкова наявність гарантійного талона і чека про покупку.',
          state:       'Як у нового в магазині.',
        }
      },

      calculateAppearance: "Стан",
      calculateEquipment:  "Комплект",

      successThanksForOrder:      "Дякуєм за заявку",
      successWaitForYouOnAddress: "Чекаємо на Вас за адресою:",
      successSimpleText:          "Розрахунок не є остаточним. Кінцева вартість буде визначена нашим фахівцем " +
                                  "після перевірки приладу на придатність і відповідність заявленої оцінки комплектації та товарного вигляду.",
      successEstimateText:        "Попередній рохрахуок найближчим часом буде відправлен на Ваш email. " +
                                  "Кінцева вартість буде визначена нашим фахівцем після " +
                                  "пперевірки приладу на придатність і відповідність заявленої оцйнки комплектації та товарного вигляду.",
      successBackToSite:          "наступна заявка",

      customerFormDescriptionText:             "Залиште свої дані, для того, щоб ми могли зв'язатися з вами, для подальшої співпраці.",
      customerFullNamePlaceHolder:             "Ф.И.О.",
      customerPhoneNumberPlaceHolder:          "Номер телефону",
      customerEmailPlaceHolder:                "E-mail",
      customerCityPlaceHolder:                 "Місто",
      customerDepartmentPlaceHolder:           "Адреса відділення",
      customerAgreePersonalDataUsePlaceHolder: "Я згодан на використання особистих даных",

      customerEditHeader:             "Точка оформлення",
      customerEditPhoneNumber:        "Номер телефону",
      customerEditState:              "Стан",
      customerEditEquipment:          "Комплект",
      customerEditInitials:           "ФИО",
      customerEditSuccessButtonValue: "Відправити",
      customerEditDepartmentAddress:  "Адреса відділення",

      mainNextButton:   "Вперед",
      mainBackButton:   "Назад",
      mainFinishButton: "Оформити",
      orderFinishButton: "У кошик",

      validatorMessageRequired:   "Необхідно заповнити",
      validatorMessageEmail:      "Введіть коректний e-mail",
      validatorMessageAppearance: 'Будь ласка оціните товарний вигляд',
      validatorMessageEquipment:  'Будь ласка оціните комплектацію',

      from: "від",
      to: "до",
    }
  },

  defaultContractTexts: {
    corp_name:                `Фізична особа підприємець Копил Олександра Олегівна, що діє на підставі Виписки про державну реєстрацію № 20740000000028831 від 15.08.2016 (далі - Сторона 1)», яка діє від імені та за рахунок Фізична особа-підприємець Цьонь Сергій Анатолійович (далі - Довіритель) відповідно до Договору доручення №1 від «05» грудня 2016р., з однієї сторони, та Фізична особа -`,
    //address_registered_text:  `зареєстрований за адресою`,
    phys_description:         `(далі Сторона2), з іншої сторони, в подальшому разом іменуються «Сторони», а кожна окремо «Сторона», уклали даний Договір купівлі-продажу (надалі іменується «Договір») про наступне:`,
    contr_item_1_1:           `В порядку та на умовах, визначених цим Договором, Сторона2 зобов'язується передати у власність Довірителю (покупцеві) належне їй на праві власності наступне рухоме майно яке було у користуванні більше року: мобільний телефон `,
    contr_item_1_1_Imei:      `IMEI (серійний номер)`,
    contr_item_1_1_afterImei: `(надалі іменується «товар»), а Сторона 1 зобов’язується прийняти такий товар та оплатити його.`,
    contr_item_1_2:           `Передача рухомого майна згідно з п.1.1. цього Договору здійснюється Стороною2 в місці укладення Договору Стороні1, яка діє як повірений Довірителя.`,
    contr_item_1_3:           `Сторона 2 зобов’язується передати товар Стороні1 під час підписання цього Договору, а Сторона1 зобов’язується прийняти товар та сплатити від імені Довірителя передбачену цим Договором ціну одночасно з отриманням майна від Сторони2.`,
    contr_item_1_4:           `Сторона2  підтверджує, що майно, визначене у п. 1.1.  цього Договору, на момент укладання цього Договору належить Стороні2 на праві власності, не знаходиться під забороною відчуження, арештом, не є предметом застави чи іншим засобом забезпечення виконання зобов’язань перед будь-якими фізичними або юридичними особами чи державою, а також не обтяжений будь-яким іншим чином, передбаченим чинним законодавством.`,
    contr_item_5_1:           `Сторона2 надає згоду використовувати персональні дані, які надані Стороні1 або Довірителю з метою реалізації державної політики в сфері захисту персональних даних, відповідно до Закону України «Про захист персональних даних» №2297-VI від 01.06.2010р. (надалі іменоване — Закон).`,
    contr_item_5_2:           `Сторона2 повністю розуміє, що вся надана інформація про неї, є персональними даними, тобто даними, які використовуються для ідентифікації Сторони2.  Сторона2 погоджується з тим, що такі дані зберігаються у Сторони1 або у Довірителя для подальшого використання відповідно до норм законодавства України та для реалізації ділових відносин між Сторонами. Персональні дані представника захищаються Конституцією України та Законом. Права Сторони2 регламентуються ст.8 Закону, а підпис на цьому документі означає однозначну згоду з вищевикладеним і підтвердженням того, що представник ознайомлений з вищезгаданими правами.`,
    storona_desc:             `Фізична особа-підприємець Копил Олександра Олегівна,01032, м. Київ, вул. Симона Петлюри, 22, р/р 26002052654922 в ПАТКБ "ПРИВАТБАНК", МФО 320649, Інд. Податковий 3218013749.`,
    dover_desc:               `Фізична особа-підприємець Цьонь Сергій Анатолійович, 69063, м. Запоріжжя, вул. Кірова, 8, р/р 2600-2-70554801 в ПАТ "БАНК КРЕДИТ ДНІПРО", МФО 305749,Інд. Податковий 3233816016.`,
  }
};
