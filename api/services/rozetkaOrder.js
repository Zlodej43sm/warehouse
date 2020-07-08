'use strict';

import request from 'request';
import xml2js from 'xml2js';
import js2xml from 'object-to-xml';
import moment from 'moment';
import {defaultTexts} from '../models/Widget';

const TIME_TO_CHECK = (7 + 1) * 24 * 60 * 60; // 1 неделя + в секундах
const ZERO_PRICE = 0; // Розетка не принимает "нулевую цену"

export function test() {
  console.log('test');
}

export async function getRozetkaIds() {
  const rozetkaId = sails.config.partnerRozetka.id;
  const rozetka = await Partner.findOne(rozetkaId);
  if (!rozetka) {
    console.log('Error in rozetka.js: Wrong partnerRozetka.id in config');
  }
  const timeToCheck = moment.utc().subtract(TIME_TO_CHECK, 'seconds').format();
  const orders = await Order.find({
    partner: rozetkaId,
    createdAt: {
      '>': timeToCheck,
    },
  });
  for (let i = 0; i < orders.length; i++) {
    console.log(orders[i].id);
    try {
      let [, body] = await helper.promisay(request, request, {
        method: 'get',
        uri: sails.config.partnerRozetka.getOrderUrl + '?ext_id=' + orders[i].id,
        auth: {
          user: sails.config.partnerRozetka.user,
          pass: sails.config.partnerRozetka.password,
          sendImmediately: false,
        }
      });
      console.log(body);
      let [data] = await helper.promisay(xml2js, xml2js.parseString, body, {
        async: true,
        explicitRoot: false,
        explicitArray: false,
      });
      console.log(data);
      if (!data || !data.records || !data.records.record || !data.records.record.id
        || !data.records.record.purchase || !data.records.record.purchase.record
        || !data.records.record.delivery || !data.records.record.delivery.npWarehouseRef
        || !data.records.record.user) {
        continue;
      }
      if (!(data.records.record.purchase.record instanceof Array)) {
        data.records.record.purchase.record = [data.records.record.purchase.record];
      }
      let found = false;
      for (let k = 0; k < data.records.record.purchase.record.length; k++) {
        if (data.records.record.purchase.record[k].ext_id == orders[i].id) {
          found = true;
          break;
        }
      }
      if (!found) {
        continue;
      }
      let externalId = data.records.record.id;
      let internalId = orders[i].id;
      let collection = 'order';
      await External.findOrCreate({
        collection,
        partner: rozetkaId,
        internalId,
      }, {
        collection,
        partner: rozetkaId,
        internalId,
        externalId,
      });
      let departmentId = data.records.record.delivery.npWarehouseRef;
      if (orders[i].state === 'pending') {
        if (orders[i].product) {
          orders[i].state = 'new';
        } else {
          orders[i].state = 'estimate';
        }
        orders[i].department = departmentId;
        let user = data.records.record.user;
        orders[i].full_name = user.contactFio;
        orders[i].phone = user.phone;
        orders[i].email = user.email;
        orders[i].increment_id = externalId;
        await orders[i].save();
      }
    } catch (ex) {
      console.log(ex);
    }
  }
}

export async function putOneOrder(order) {
  if (!sails.config.partnerRozetka || !sails.config.partnerRozetka.id || !order.department) {
    return;
  }
  const department = await Department.findOne(order.department);
  console.log(department)
  const rozetkaId = sails.config.partnerRozetka.id;
  const rozetka = await Partner.findOne(rozetkaId);
  if (!rozetka) {
    console.log('Error in rozetka.js: Wrong partberRozetka.id in config');
  }
  if (rozetkaId != order.partner) {
    return;
  }
  await Queue.findOrCreate({
    partner: rozetkaId,
    collection: 'order',
    internalId: order.id
  },{
    partner: rozetkaId,
    collection: 'order',
    internalId: order.id
  });
  const params = [];
  if (order.device_type) {
    [params.push(order.device_type)]
  }
  params.push(order.device_brand, order.device_model);
  if (order.notebook) {
    params.push(order.device_proc, order.device_ram, order.device_hard, order.device_video);
  }
  let localizedText;
  if (order.locale === 'ua') {
    localizedText = defaultTexts.ua;
  } else {
    localizedText = defaultTexts.ru;
  }
  params.push(localizedText.equipment[order.equipment].description,
    localizedText.appearance[order.appearance].description);
  const js = {
    '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
    Purchase: {
      records: {
        record: {
          ext_id: order.id,
          fields: {
            price: order.price_estimated || ZERO_PRICE,
            market_status: order.state,
            title: params.join(' '),
          }
        }
      }
    }
  };
  const xml = js2xml(js);
  console.log('*** Update order ***');
  console.log(department.partner);
  console.log(xml);
  const [, body] = await helper.promisay(request, request, {
    method: 'put',
    uri: sails.config.partnerRozetka.orderUrl,
    body: xml,
    header: {
      'Content-Type': 'text/xml',
    },
    auth: {
      user: sails.config.partnerRozetka.users[department.partner].user,
      pass: sails.config.partnerRozetka.users[department.partner].password,
      sendImmediately: true,
    }
  });
  console.log(body)
  return body;
}

export async function syncExternalOrders() {
  if (!sails.config.partnerRozetka || !sails.config.partnerRozetka.id) {
    return;
  }
  const rozetkaId = sails.config.partnerRozetka.id;
  const rozetka = await Partner.findOne(rozetkaId);
  if (!rozetka) {
    console.log('Error in rozetka.js: Wrong partberRozetka.id in config');
  }
  const timeToCheck = moment.utc().subtract(1, 'years').format();
  const orders = await Queue.find({
    partner: rozetkaId,
    collection: 'order',
    createdAt: {
      '>': timeToCheck,
    },
  });
  for (let i = 0; i < orders.length; i++){
    try {
      if (!orders[i].internalId) {
        console.log('Empty inernal Id in collection Queue');
        continue;
      }
      let order = await Order.findOne(orders[i].internalId).populate('department');
      if (!order) {
        console.log('Order not found in collection order');
        continue;
      }
      if (!order.department) {
        console.log('Order without department');
        continue;
      }
      let [, body] = await helper.promisay(request, request, {
        method: 'get',
        uri: sails.config.partnerRozetka.getOrderUrl + '?ext_id=' + orders[i].internalId,
        auth: {
          user: sails.config.partnerRozetka.user,
          pass: sails.config.partnerRozetka.password,
          sendImmediately: true,
        }
      });
      let data;
      if (body) {
        [data] = await helper.promisay(xml2js, xml2js.parseString, body, {
          async: true,
          explicitRoot: false,
          explicitArray: false,
        });
      }
      if (!data || !data.records) {
        await orders[i].destroy();
      } else if (!data || !data.records || !data.records.record
        || !data.records.record.market_status
        || order.state !== data.records.record.market_status.id
        || Number(order.price_estimated) !== Number(data.records.record.price)
        && order.price_estimated) {
        const js = {
          '?xml version=\"1.0\" encoding=\"UTF-8\"?': null,
          Purchase: {
            records: {
              record: {
                ext_id: order.id,
                fields: {
                  price: order.price_estimated || ZERO_PRICE,
                  market_status: order.state,
                }
              }
            }
          }
        };
        const xml = js2xml(js);
        const [, body] = await helper.promisay(request, request, {
          method: 'put',
          uri: sails.config.partnerRozetka.orderUrl,
          body: xml,
          header: {
            'Content-Type': 'text/xml',
          },
          auth: {
            user: sails.config.partnerRozetka.users[order.department.partner].user,
            pass: sails.config.partnerRozetka.users[order.department.partner].password,
            sendImmediately: true,
          }
        });
        console.log('*** Order upated in stream  ***');
        console.log('partner', order.department.partner);
        console.log(xml);
        console.log(body);
      } else {
        await orders[i].destroy();
      }
    } catch (ex) {
      console.log(ex);
    }
  }
}
