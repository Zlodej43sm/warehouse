# tehnostok-calculator

a [Sails](http://sailsjs.org) application

# Configure email
 Создать файл emailConfig.json в папке config, в котором прописать доступ к smtp серверу

## Register SU
```bash
./node_modules/.bin/sails console

registerUser({email: "superadmin@gmail.com", username: "superadmin", "password": "password", "role": "SU"}, (err, u) => console.log(err, u))
```

```
 docker build -t myapp $path_to_file  // example: /home/yura/Projects/tehnostok-calculator/api/services/soap
 docker run -it --rm --name my-running-app myapp
```
## Deploy

```bash
# сохранить данные доступов из api/services/soap/sync.php и config/email.js
git reset --hard
git pull orgin master
# восстановить данные доступов в api/services/soap/sync.php и config/email.js
cd ../ # pwd = /home/lyashenko/node
pm2 delete calc
pm2 start calc
```

## Configure

config/local.js

```
module.exports = {

  port: process.env.PORT || 1337,
  environment: process.env.NODE_ENV || 'development',
  environment: process.env.NODE_ENV || 'development',

  connections: {
    mongo: {
      adapter: 'sails-mongo',
      host: 'localhost',
      port: 27017,
      database: 'tehnostok-calculator'
    }
  },

  session: {
    adapter: 'mongo',
    host: 'localhost',
    port: 27017,
    db: 'tehnostok-calculator',
    collection: 'sessions'
  },

  proxyHost: 'calc.delta.branderstudio.com',
  proxyPort: 80,
  proxyProtocol: 'http'

};
```

config/emailConfig.json

```
{
  "service": "Gmail",
  "auth": {
    "user": "apapacy@gmail.com",
    "pass": "chmag10293847"
  }
}
```
