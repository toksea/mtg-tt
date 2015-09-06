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

const DEFAULT_DEST_LANG = 'en';

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

function findImgByTitleAndLang(title, inputLang, destLang) {
  debug('looking for', title, inputLang);

  var queryKey = 'title.' + inputLang;

  return db.findOneAsync({queryKey: title})
    .then(function(card) {

      debug('@db.find ok', card);

      // 如果 db 中未找到，可能是没有下过（也可能是不存在）
      if (_.isNull(card)) {

        // 需要下载该牌的信息
        return downloadCard(title, inputLang, destLang);

        // @todo 是否考虑相对 db 内信息的某个新版本，出了旧牌的新语言
        // （将查到的新牌，对应到老牌上）

      }

      // 否则 db 中存在该牌的信息
      // 如果已下载过目标语言的牌，则返回文件路径
      if (_.has(card, ['file', destLang])) {
        return card.file[destLang];
      }

      // 否则，检查是否有目标语言的页面 url
      if (_.has(card, ['url', destLang])) {

        // 下载该语言的牌，返回
        return downloadCardImg(card, destLang);

      }

      // @todo 是否考虑检查相对 db 内信息的某个新版本，出了旧牌的新语言
      // 即使用默认语言前，先 magiccards 查一下，若有，则更新 db

      // 如果没有，则使用默认语言
      if (_.has(card, ['file', DEFAULT_DEST_LANG])) {
        return card.file[DEFAULT_DEST_LANG];
      }

      return downloadCardImg(card, DEFAULT_DEST_LANG);

    }, function(err) {
      debug('@db.find er', err);
    });
}

// 下载指定标题的牌的目标语言版本
// @todo 输入语言可忽略
function downloadCard(title, inputLang, destLang) {

}

// 下载指定牌的目标语言版本的图片
function downloadCardImg(card, destLang) {

}

module.exports = {
    findImgByTitleAndLang: findImgByTitleAndLang
};

// tests

// findImgByTitleAndLang('Island')
//     .then(console.log);
