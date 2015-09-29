'use strict';

var BPromise = require('bluebird')
, debug = require('debug')('mtg:db')
, fs = require('fs')
, mkdirp = require('mkdirp')
, Datastore = require('nedb')
, dbFile = fs.realpathSync(__dirname + '/../db/info.db')
, dbImgLib = fs.realpathSync(__dirname + '/../db/img/')
, db = new Datastore({ filename: dbFile, autoload: true })
, _ = require('lodash')
, magiccards = require('./magiccards')
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
  debug('@findImgByTitleAndLang', title, inputLang);

  return findCardByTitleAndLang(title, inputLang)
    .then(function(card) {
      debug('@findImgByTitleAndLang card', card)
      return findImgByLangOrDefaultLang(card, destLang);
    })
    .catch(function(err) {
      // 找不到卡牌
      debug('@findImgByTitleAndLang err', err)
      return null;
    });
}

function findCardByTitleAndLang(title, inputLang) {
  var queryKey = 'titles.' + inputLang,
      query = {};

  // 搜索时，case insensitive
  // 参考：https://github.com/louischatriot/nedb/issues/312
  query[queryKey] = {$regex: new RegExp(title, 'i')};

  debug(query);
  return db.findOneAsync(query)
    .then(function(card) {

      debug('@db.find ok', card);

      // 如果 db 中未找到，可能是没有下过（也可能是不存在）
      if (_.isNull(card)) {

        debug('null card');

        // 需要下载该牌的信息
        // @todo 这里下载暂未传语言，即假设不同语言不会有拼写相同、
        // 实际却不同的牌 => 中文简体和中文繁体就有很多例子，安普林策士
        return downloadCard(title);
        // @todo downloadCard 中如果 reject，
        // 传不到外层（findImgByTitleAndLang），即使
        // 在此 catch 也不行


        // @todo 是否考虑相对 db 内信息的某个新版本，出了旧牌的新语言
        // （将查到的新牌，对应到老牌上）

      }

      return card;
    });
  // @todo catch db exception
}

function findImgByLangOrDefaultLang(card, destLang) {

  return findImgByLang(card, destLang)
    .then(function(imgPath) {
      return imgPath;
    })
    .catch(function(err) {
      // 没有 destLang 的图片，则返回默认语言的
      debug('findImgByLangOrDefaultLang err', err);
      return findImgByLang(card, DEFAULT_DEST_LANG)
    });
}

function findImgByLang(card, destLang) {

  debug('@findImgByLang', destLang, card.titles[destLang]);

  // 如果已下载过目标语言的牌，则返回文件路径
  if (_.has(card, ['files', destLang])) {
    debug('@findImgByLang files', card.files[destLang]);

    return BPromise.resolve(card.files[destLang]);
  }

  // 否则，检查是否有目标语言的页面 url
  if (_.has(card, ['links', destLang])) {
    debug('@findImgByLang links', card.links[destLang]);

    // 下载该语言的牌，返回
    return downloadCardImg(card, destLang);
  }

  // @todo 是否考虑检查相对 db 内信息的某个新版本，出了旧牌的新语言
  // 即使用默认语言前，先 magiccards 查一下，若有，则更新 db

  // 否则，该牌没有指定语言的版本
  return BPromise.reject('no dest lang');

}

// 下载指定标题的牌的目标语言版本
// @todo 输入语言可忽略
function downloadCard(title) {
  debug('@downloadCard', title);


  return magiccards.downloadCard(title)
    .then(storeCard)
    .catch(function(err) {

      debug('@downloadCard err', err);

      // return BPromise.reject('card is not exist');
      return null;
    });

}

function storeCard(card) {

  debug('@storeCard');

  return db.insertAsync(card);

}

// 下载指定牌的目标语言版本的图片
function downloadCardImg(card, destLang) {

  var myImgPath;

  return magiccards.downloadCardImg(card.links[destLang], card.titles[destLang])
    .then(function(imgPath) {
      debug('@downloadCardImg', imgPath);

      myImgPath = imgPath;
      return saveCardImg(card, destLang, imgPath);
    })
    .then(function(res) {
      // 正常时，res = 1
      return myImgPath;
    });

}

function saveCardImg(card, destLang, imgPath) {

  if (_.isUndefined(card.files)) {
    card.files = {};
  }
  card.files[destLang] = imgPath;

  return db.updateAsync({_id: card._id}, card, { multi: false });

}

module.exports = {
    findImgByTitleAndLang: findImgByTitleAndLang
};

// tests

// findImgByTitleAndLang('Island')
//     .then(console.log);
