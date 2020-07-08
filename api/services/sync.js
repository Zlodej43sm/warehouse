var child_process        = require('child_process')
  , path          = require('path')
  , phpScriptPath = path.join(__dirname, 'soap/sync.php');


function getScript() {
  return new Promise(function (resolve, reject) {
    var process = child_process.exec('docker -v', function (err, response, stderr) {
      if (err) {
        reject(err);
      }
    });
    process.on('exit', function (code) {
      if (code != '0') {
       return resolve('php ' + phpScriptPath + ' getpricelist')
      }
      return resolve('docker run -i --rm --name my-running-app myapp');
    })
  })

}

module.exports = {
  products: function (cb) {
    getScript().then(function (script) {
      child_process.exec(script, {maxBuffer: 1024 * 100000}, function (err, phpResponse, stderr) {
        if (err) cb(err);
        cb(null, JSON.parse(phpResponse) || []);
      });
    })
  },
  rates:    function (cb) {
    child_process.exec('php ' + phpScriptPath + ' getratelist', function (err, phpResponse, stderr) {
      if (err) cb(err);
      cb(null, JSON.parse(phpResponse) || []);
    });
  }
}
