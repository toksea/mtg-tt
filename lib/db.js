var BPromise = require('bluebird')
, debug = require('debug')('mtg:db')
, fs = require('fs')
, mkdirp = require('mkdirp')
, Datastore = require('nedb')
, dbFile = fs.realpathSync(__dirname + '/../db/info.db')
, dbImgLib = fs.realpathSync(__dirname + '/../db/img/')
, db = new Datastore({ filename: dbFile, autoload: true })
, _ = require('lodash')
;

debug('dbFile', dbFile);
debug('dbImgLib', dbImgLib);

mkdirp.sync(dbImgLib);

db = BPromise.promisifyAll(db);

// 示例对象
//
// {
//   versions: [{
//     "block": "rtr",
//     "no": 238,
//   }, {
//     "block": "rtr",
//     "no": 238,
//   }]
//   "title": {
//     "en": "Blood Crypt"
//   },
//   "imgUrl": {
//     "en": "http://magiccards.info/scans/en/rtr/238.jpg",
//     "cn": "http://magiccards.info/scans/cn/rtr/238.jpg",
//   }
//   "file": {
//     "en": "/Users/xp/Code/mtg-tt/db/img/Blood Crypt.jpg",
//   }
//   "_id":"0CECy7gmzlJ4kfeV",
// }

function findImgByTitleAndLang(title, lang) {
  debug('looking for', title, lang);

  var titleLang = 'title.' + lang;

  return db.findAsync({titleLang: title})
    .then(function(cards) {

      if (_.isEmpty(cards)) {

        // db 中未找到，下载
        return null;

      }

      debug('@db.find ok', card);

      return card[0].file;

    }, function(err) {
      debug('@db.find er', err);
    });
}

module.exports = {
    findImgByTitleAndLang: findImgByTitleAndLang
};

// tests

// findImgByTitleAndLang('Island')
//     .then(console.log);
