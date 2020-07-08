'use strict';
GLOBAL.numeral = require('numeral');


const request = require('request');
const xml2js = require('xml2js');
const js2xml = require('object-to-xml');
// const ObjectId = require('mongodb').ObjectID;
const _ = require('lodash');
const DEPARTMENT_NAME = 'Техносток';

function detranslit(string) {
  return String(string)
    .replace(/'|’|&apos;/g, 'ʼ')
    .replace(/&quot;|&#34;/g, '"')
    // .replace(/I/g, 'і')
    // .replace(/i/g, 'і')
    //.replace(/E/g, 'е')
    // .replace(/e/g, 'е')
    .trim();
}

// Убираем тип населенного пункта
function clear(string) {
  return String(string).replace(/\([^)]*\)/,'').replace(/^[^ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮІЄ]+/, '').trim();
}

module.exports = {

  test() {
    console.log('test');
  },


  /*
   * Список всех городов из сервисов Розетки
   */
  async getCities(part) {
    try {
      const self = this;
      if (!sails.config.partnerRozetka) {
        console.log('Error in rozetka.js: Wrong partnerRozetka.id in config');
        return;
      }
      let rozetkaId = sails.config.partnerRozetka.id;
      const collection = 'department_city';
      const rozetka = await Partner.findOne(rozetkaId);
      if (!rozetka) {
        console.log('Error in rozetka.js: Partner not found by config.partnerRozetka.id');
        return;
      }
      var [response , body] = await helper.promisay(request, request, {
        method: 'get',
        uri: sails.config.partnerRozetka.citiesUrl + (part ? '?part=' + part : ''),
        auth: {
          user: sails.config.partnerRozetka.user,
          pass: sails.config.partnerRozetka.password,
          sendImmediately: false
        }
      });
      var [data] = await helper.promisay(xml2js, xml2js.parseString, body, {
        async: true,
        explicitRoot: false,
        explicitArray: false,
      });
      let cities;
      if (data.records.record instanceof Array) {
        cities = data.records.record;
      } else {
        cities = [data.records.record];
      }
      // console.log(cities)
      let requests = [];
      for (let i = 0; i < cities.length; i++) {
        if (
          sails.config.partnerRozetka.cities[cities[i].name] != cities[i].id
          && sails.config.partnerRozetka.cities[cities[i].name_ua] != cities[i].id
          && 74 != cities[i].id
          && (cities[i].region_title === 'Заблокированные обл.'
            || cities[i].district_title && cities[i].district_title.substring(0, 4) !== cities[i].name.substring(0, 4)
            || cities[i].region_title && cities[i].region_title.substring(0, 4) !== cities[i].name.substring(0, 4))
        ) {
          continue;
        }
        requests.push(External.findOrCreate({
          collection,
          partner: rozetkaId,
          internalId: cities[i].name.trim(),
          // externalId: cities[i].id, - неоднозначность не нужна
        }, {
          collection,
          partner: rozetkaId,
          internalId: cities[i].name.trim(),
          externalId: cities[i].id,
          memo: cities[i].region_title,
        }));
        requests.push(External.findOrCreate({
          collection,
          partner: rozetkaId,
          internalId: detranslit(cities[i].name_ua),
          // externalId: cities[i].id, - неоднозначность не нужна
        }, {
          collection,
          partner: rozetkaId,
          internalId: detranslit(cities[i].name_ua),
          externalId: cities[i].id,
          memo: cities[i].region_title,
        }));
      }
      await Promise.all(requests);
      requests = [];
      for (let i = 0; i < cities.length; i++) {
        if (
          sails.config.partnerRozetka.cities[cities[i].name] != cities[i].id
          && sails.config.partnerRozetka.cities[cities[i].name_ua] != cities[i].id
          && 74 != cities[i].id
          && (cities[i].region_title === 'Заблокированные обл.'
            || cities[i].district_title && cities[i].district_title.substring(0, 4) !== cities[i].name.substring(0, 4)
            || cities[i].region_title && cities[i].region_title.substring(0, 4) !== cities[i].name.substring(0, 4))
        ) {
          continue;
        }
        requests.push(External.update({
          collection,
          partner: rozetkaId,
          internalId: cities[i].name.trim(),
          // externalId: cities[i].id, - неоднозначность не нужна
        }, {
          collection,
          partner: rozetkaId,
          internalId: cities[i].name.trim(),
          externalId: cities[i].id,
          memo: cities[i].region_title,
        }));
        requests.push(External.update({
          collection,
          partner: rozetkaId,
          internalId: detranslit(cities[i].name_ua),
          // externalId: cities[i].id, - неоднозначность не нужна
        }, {
          collection,
          partner: rozetkaId,
          internalId: detranslit(cities[i].name_ua),
          externalId: cities[i].id,
          memo: cities[i].region_title,
        }));
      }
      await Promise.all(requests);
      if (Number(data.part.end)) {
        console.log('rozetka: sities loaded.');
      } else {
         await self.getCities(data.part.next_part)
      }
    } catch (ex) {
      console.log(ex);
    }
  },

  /*
   * Синхронизация всех подразделений с сервером Розетки
   */
   async syncDepartments() {
     const ids = sails.config.partnerRozetka.users.ids;
     for (let i = 0; i < ids.length; i++) {
       await this.syncDepartment(ids[i]);
     }
   },

  async syncDepartment(partnerId) {
    try {
      const self = this;
      if (!sails.config.partnerRozetka) {
        console.log('Error in rozetka.js: Wrong partnerRozetka.id in config');
        return;
      }
      let rozetkaId = sails.config.partnerRozetka.id;
      const rozetka = await Partner.findOne(rozetkaId);
      if (!rozetka) {
        console.log('Error in rozetka.js: Not found Partner by config.partnerRozetka.id');
        return;
      }
      // let partnerId = rozetkaId;
      // if (rozetka.replaceDepartments) {
      //  partnerId = rozetka.replaceDepartments;
      // }
      const collection = 'department';
      const rozetkaDepartments = await this.getDepartments(partnerId);
      // console.log('rozetkaDepartments', JSON.stringify(rozetkaDepartments, null, 2))
      const rozetkaDepartmentsByInternalId = _.keyBy(rozetkaDepartments, 'code');
      const localDepartments = await Department.find({partner: partnerId}).populate('partner');
      //console.log('localDepartments', JSON.stringify(localDepartments, null, 2))
      const localDepartmentsByInternalId = _.keyBy(localDepartments, 'id');
      let externalDepartments = await External.find({partner: rozetkaId, collection});
      let externalDepartmentsByInternalId = _.keyBy(externalDepartments, 'internalId');
      let externalDepartmentsByExternalId = _.keyBy(externalDepartments, 'externalId');
      // Добавляем в таблицу связи отсутсвующие записи полученные с червера Розетки
      const departmantsToAdd = _.filter(rozetkaDepartments,
        item => !externalDepartmentsByExternalId[item.id]
      );
      await this.addDepartments(departmantsToAdd, rozetkaId);
      externalDepartments = await External.find({partner: rozetkaId, collection});
      externalDepartmentsByInternalId = _.keyBy(externalDepartments, 'internalId');
      externalDepartmentsByExternalId = _.keyBy(externalDepartments, 'externalId');
      const departmentsToPost = _.filter(localDepartments,
        item => !rozetkaDepartmentsByInternalId[String(item.id)] && !item.isDisabled);
      const departmentsToPut = _.filter(localDepartments,
        item =>  rozetkaDepartmentsByInternalId[String(item.id)]
          && !this.isValidDepartment(item, rozetkaDepartmentsByInternalId[String(item.id)])
      );
      const departmentsToDelete = _.filter(rozetkaDepartments,
        item => !localDepartmentsByInternalId[String(item.code)] || localDepartmentsByInternalId[String(item.code)].isDisabled
      );
      console.log('*******************************', partnerId);
      console.log('*******************************', rozetkaId);
      console.log('================================');
      //console.log(JSON.stringify(departmentsToPut, null, 2));
      //console.log('++++++++++++++++++++++++++++++++');
      //console.log(JSON.stringify(departmentsToPost, null, 2));
      // console.log('----------------------------------');
      // console.log(JSON.stringify(departmentsToDelete, null, 2));
      await this.postDepartments(departmentsToPost, rozetkaId, partnerId);
      await this.putDepartments(departmentsToPut, rozetkaId, partnerId);
      await this.lockDepartments(departmentsToDelete, rozetkaId, partnerId);
    } catch (ex) {
      console.log(ex);
    }
  },

  /*
   * Проверка на изменение полей реквизитов пункта
   */
  isValidDepartment(localDepartment, rozetkaDepartment) {
    if (!localDepartment || !rozetkaDepartment) {
      console.log('*** Not matched departments ***');
      console.log('localDepartment', localDepartment)
      console.log('rozetkaDepartment', rozetkaDepartment)
      return false;
    }
    const localStatus = localDepartment.isDisabled ? 'locked': 'active';
    if (localStatus === 'locked' && rozetkaDepartment.status === 'locked') {
      return true;
    }
    const valid = detranslit(localDepartment.partner.title) == detranslit(rozetkaDepartment.name)
      && detranslit(localDepartment.partner.title) == detranslit(rozetkaDepartment.number)
      && localDepartment.longitude == rozetkaDepartment.longitude
      && localDepartment.latitude == rozetkaDepartment.latitude
      && localDepartment.address == rozetkaDepartment.street
      && localDepartment.house == rozetkaDepartment.house
      && localStatus == rozetkaDepartment.status
      && detranslit(localDepartment.comment) == detranslit(rozetkaDepartment.comment);
      //&& detranslit(clear(localDepartment.city)) == detranslit(clear(rozetkaDepartment.cityName));
      if (!valid) {
        console.log('*** Not valid ***')
        console.log(detranslit(localDepartment.partner.title), detranslit(rozetkaDepartment.name));
        console.log(detranslit(localDepartment.partner.title), detranslit(rozetkaDepartment.number));
        console.log(localDepartment.longitude, rozetkaDepartment.longitude);
        console.log(localDepartment.latitude, rozetkaDepartment.latitude);
        console.log(localDepartment.address, rozetkaDepartment.street);
        console.log(localDepartment.house, rozetkaDepartment.house);
        console.log(localStatus, rozetkaDepartment.status);
        console.log(detranslit(localDepartment.comment), detranslit(rozetkaDepartment.comment));
        console.log(detranslit(clear(localDepartment.city)), detranslit(clear(rozetkaDepartment.cityName)));
      }
      return valid;

  },

  async getDepartments(partnerId, part = 0, rozetkaDepartments = []) {
    try {
      const self = this;
      let [response, departments] = await helper.promisay(request, request, {
        method: 'get',
        uri: sails.config.partnerRozetka.departmentsUrl + (part ? '?status=all&part=' + part : '?status=all'),
        auth: {
          user: sails.config.partnerRozetka.users[partnerId].user,
          pass: sails.config.partnerRozetka.users[partnerId].password,
          sendImmediately: true
        }
      });
      const [data] = await helper.promisay(xml2js, xml2js.parseString, departments, {
        async: true,
        explicitRoot: false,
        explicitArray: false,
      });
      if (data.records.record instanceof Array) {
        departments = data.records.record;
      } else if (data.records.record) {
        departments = [data.records.record];
      } else {
        departments = [];
      }
      rozetkaDepartments.push(...departments);
      if (Number(data.part.end)) {
        console.log('rozetka: departments in-memory loaded.');
        return rozetkaDepartments;
      } else {
        await self.getDepartments(partnerId, data.part.next_part, rozetkaDepartments)
      }
    } catch (ex) {
      console.log(ex);
    }
  },

  // Восстанавливаем с сервера Розетки подразделения которых нет в локальной базе
  async addDepartments(departments, partner) {
    const collection = 'department';
    try {
      for (let i = 0; i < departments.length; i++) {
        await External.findOrCreate({
          partner,
          collection,
          internalId: departments[i].code,
          externalId: departments[i].id,
        }, {
          partner,
          collection,
          internalId: departments[i].code,
          externalId: departments[i].id,
          memo: 'Восстановлена с сервера Розетки'
        });
      }
    } catch (ex) {
      console.log(ex);
    }
  },

  async postDepartments(departments, partner, partnerId) {
    const collection = 'department_city';
    for (let i = 0; i < departments.length; i++) {
      let record = [];
      let city = await External.find({
        partner,
        collection,
        internalId: detranslit(clear(departments[i].city))
      }).sort({
        externalId: 1
      });
      if (!city || city.length === 0) {
        console.log(`Not found city ${detranslit(clear(departments[i].city))}`);
        continue;
      } else {
        record.push({
          locality: city[0].externalId,
          code: departments[i].id,
          name: departments[i].partner.title,
          number: departments[i].partner.title,
          street: departments[i].address,
          house: departments[i].house,
          comment: departments[i].comment,
          longitude: departments[i].longitude,
          latitude: departments[i].latitude,
          status: departments[i].isDisabled ? 0: 1,
        });
      }
      if (record.length === 0) {
        return;
      }
      const js = {
        '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
        Warehouse: {
          records: {
            record
          }
        }
      }
      const xml = js2xml(js)
      const [response, body] = await helper.promisay(request, request, {
        method: 'post',
        uri: sails.config.partnerRozetka.departmentsUrl,
        body: xml,
        header: {
          'Content-Type': 'text/xml'
        },
        auth: {
          user: sails.config.partnerRozetka.users[partnerId].user,
          pass: sails.config.partnerRozetka.users[partnerId].password,
          sendImmediately: true
        }
      });
      console.log('*** departments for add ***')
      console.log(xml)
      console.log(body)
    }
    return;
  },

  async putDepartments(departments, partner, partnerId) {
    try {
      const collection = 'department_city';
      for (let i = 0; i < departments.length; i++) {
        let record = [];
        let city = await External.find({
          partner,
          collection,
          internalId: detranslit(clear(departments[i].city))
        }).sort({
          externalId: 1
        });
        if (!city || city.length === 0) {
          console.log(`Not found city ${departments[i].city}`);
          continue;
        } else {
          record.push({
            // id: departments[i].externalId, - error incorect data
            code: departments[i].id,
            fields: {
              locality: city[0].externalId,
              name: departments[i].partner.title,
              number: departments[i].partner.title,
              street: departments[i].address,
              house: departments[i].house,
              comment: departments[i].comment,
              longitude: departments[i].longitude,
              latitude: departments[i].latitude,
              status: departments[i].isDisabled ? 0: 1,
            }
          });
        }
        const js = {
          '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
          Warehouse: {
            records: {
              record
            }
          }
        };
        const xml = js2xml(js);
        const [response, body] = await helper.promisay(request, request, {
          method: 'put',
          uri: sails.config.partnerRozetka.departmentsUrl,
          body: xml,
          header: {
            'Content-Type': 'text/xml'
          },
          auth: {
            user: sails.config.partnerRozetka.users[partnerId].user,
            pass: sails.config.partnerRozetka.users[partnerId].password,
            sendImmediately: true
          }
        });
        console.log('*** departments for change ***')
        console.log(xml);
        console.log(body)
      }
      return;
    } catch (ex) {
      console.log(ex);
    }
  },

  async postOneDepartmet(department) {
    if (!sails.config.partnerRozetka || !sails.config.partnerRozetka.id) {
      return;
    }
    const rozetkaId = sails.config.partnerRozetka.id;
    const rozetka = await Partner.findOne(rozetkaId);
    if (!rozetka) {
      console.log('Error in rozetka.js: Wrong partberRozetka.id in config');
    }
    let partnerId = rozetkaId;
    if (rozetka.replaceDepartments) {
      partnerId = rozetka.replaceDepartments;
    }
    if (partnerId !== department.partner
      && partnerId instanceof Array
      && partnerId.indexOf(department.partner) === -1) {
      return;
    }
    const record = [];
    let city = await External.find({
      partner: rozetkaId,
      collection: 'department_city',
      internalId: detranslit(clear(department.city))
    }).sort({
      externalId: 1
    });
    var partner;
    if (!city || city.length === 0) {
      console.log(`Not found city ${department.city}`);
      return;
    } else {
      partner = await Partner.findOne(department.partner);
      record.push({
        code: department.id,
        locality: city[0].externalId,
        name: partner.title,
        number: partner.title,
        street: department.address,
        house: department.house,
        comment: department.comment,
        longitude: department.longitude,
        latitude: department.latitude,
        status: department.isDisabled ? 0: 1,
      });
    }
    const js = {
      '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
      Warehouse: {
        records: {
          record
        }
      }
    };
    const xml = js2xml(js);
    const [response, body] = await helper.promisay(request, request, {
      method: 'post',
      uri: sails.config.partnerRozetka.departmentsUrl,
      body: xml,
      header: {
        'Content-Type': 'text/xml'
      },
      auth: {
        user: sails.config.partnerRozetka.users[partner.id].user,
        pass: sails.config.partnerRozetka.users[partner.id].password,
        sendImmediately: true
      }
    });
    console.log(xml);
    console.log(body);
    var [data] = await helper.promisay(xml2js, xml2js.parseString, body, {
      async: true,
      explicitRoot: false,
      explicitArray: false,
    });
    let externalIds;
    if (!data || !data.records) {
      externalIds = [];
    }
    else if (data.records.record instanceof Array) {
      externalIds = data.records.record;
    } else {
      externalIds = [data.records.record];
    }
    if (externalIds.length > 0 && externalIds[0].status == 'OK' && externalIds[0].id) {
      await External.findOrCreate({
        partner: rozetkaId,
        collection: 'department',
        externalId: externalIds[0].id,
        internalId: department.id
      }, {
        partner: rozetkaId,
        collection: 'department',
        externalId: externalIds[0].id,
        internalId: department.id,
        memo: 'Заведено в интерфейсе'
      });
    }
    return body;
  },

  async putOneDepartmet(department) {
    if (!sails.config.partnerRozetka || !sails.config.partnerRozetka.id) {
      return;
    }
    const rozetkaId = sails.config.partnerRozetka.id;
    const rozetka = await Partner.findOne(rozetkaId);
    if (!rozetka) {
      console.log('Error in rozetka.js: Wrong partberRozetka.id in config');
    }
    let partnerId = rozetkaId;
    if (rozetka.replaceDepartments) {
      partnerId = rozetka.replaceDepartments;
    }
    if (partnerId != department.partner
      && partnerId instanceof Array
      && partnerId.indexOf(department.partner) === -1) {
      return;
    }
    const isFound = await External.findOne({
      collection: 'department',
      partner: rozetkaId,
      internalId: department.id
    });
    if (!isFound) {
      return;
    }
    const partner = await Partner.findOne(department.partner);
    const record = [];
    let city = await External.find({
      partner: rozetkaId,
      collection: 'department_city',
      internalId: detranslit(clear(department.city))
    }).sort({
      externalId: 1
    });
    if (!city || city.length === 0) {
      console.log(`Not found city ${detranslit(clear(department.city))}`);
      return;
    } else {
      record.push({
        // id: departments[i].externalId, - error incorect data
        code: department.id,
        fields: {
          locality: city[0].externalId,
          name: partner.title,
          number: partner.title,
          street: department.address,
          house: department.house,
          comment: department.comment,
          longitude: department.longitude,
          latitude: department.latitude,
          status: department.isDisabled ? 0: 1,
        }
      });
    }
    const js = {
      '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
      Warehouse: {
        records: {
          record
        }
      }
    };
    const xml = js2xml(js);
    const [response, body] = await helper.promisay(request, request, {
      method: 'put',
      uri: sails.config.partnerRozetka.departmentsUrl,
      body: xml,
      header: {
        'Content-Type': 'text/xml'
      },
      auth: {
        user: sails.config.partnerRozetka.users[partner.id].user,
        pass: sails.config.partnerRozetka.users[partner.id].password,
        sendImmediately: true
      }
    });
    return body;
  },

  async lockDepartments(departments, rozetkaId, partnerId) {
    // console.log('777777777777777777777777')
    // console.log(JSON.stringify(departments, null, 2))
    const activeDepartments = _.filter(departments, department => department.status !== 'locked');
    if (activeDepartments.length === 0) {
      return;
    }
    // console.log('99999999999999999999999999999')
    // console.log(JSON.stringify(departments, null, 2))
    const js = {
      '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
      Warehouse: {
        records: {
          record: _.map(activeDepartments, department => ({
            code: department.code,
            fields: {
              status: 0,
            },
          }))
        }
      }
    }
    const xml = js2xml(js);
    const[response, body] = await helper.promisay(request, request, {
      method: 'put',
      uri: sails.config.partnerRozetka.departmentsUrl,
      body: xml,
      header: {
        'Content-Type': 'text/xml'
      },
      auth: {
        user: sails.config.partnerRozetka.users[partnerId].user,
        pass: sails.config.partnerRozetka.users[partnerId].password,
        sendImmediately: true
      }
    });
    console.log('*** departments for delete ***')
    console.log(xml);
    console.log(body);
    return body;
  },

};
