var BPromise = require('bluebird')
, debug = require('debug')('mtg:db')
, fs = require('fs')
, mkdirp = require('mkdirp')
, Datastore = require('nedb')
, dbFile = fs.realpathSync(__dirname + '/../db/info.db')
, dbImgLib = fs.realpathSync(__dirname + '/../db/img/')
, db = new Datastore({ filename: dbFile, autoload: true })
;

debug('dbFile', dbFile);
debug('dbImgLib', dbImgLib);

mkdirp.sync(dbImgLib);

db = BPromise.promisifyAll(db);

function findImgByTitleAndLang(title, lang) {
  debug('looking for', title, lang);

  return db.findAsync({title: title})
    .then(function(card) {

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
