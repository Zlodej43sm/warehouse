'use strict';

const request = require('superagent');
const _       = require('lodash');

const HOST    = 'http://localhost:1337';
const WIDGET  = '574f0fecba7347192b372537';
const PARTNER = '574f0fd4ba7347192b372535';

function req(data) {
  return new Promise((resolve, reject) =>
    request
      .post(`${HOST}/widget/order`)
      .send(data)
      .end((err, res) => err ? reject(err) : resolve(res)))
}

const QUITE = _.includes(process.argv, '-q') || _.includes(process.argv, '--quite');

req({
  widget:       WIDGET,
  partner:      PARTNER,
  appearance:   1,
  equipment:    1,
  device_type:  "phone",
  device_brand: "iphone",
  device_model: "6s++",
  full_name:    "Владимир",
  phone:        "+38(066)151-42-85",
  email:        "vladimir+client@odesskij.com",
  city:         "kharkiv",
  agree:        1
})
  .then((r) => !QUITE && console.log(require('util').inspect(r, { showHidden: true, depth: null })))
  .catch((reason) => !QUITE && console.log(require('util').inspect(reason, { showHidden: true, depth: null })));

