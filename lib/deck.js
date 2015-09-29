'use strict';

var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg:deck')
, fs = require('fs')
, fse = require('fs-extra')
, path = require('path')
, moment = require('moment')
, _ = require('lodash')
, mkdirp = require('mkdirp')
, PDFDocument = require('pdfkit')
, basicLands = [
  'Plains',
  'Island',
  'Swamp',
  'Mountain',
  'Forest',
  'Evolving Wilds'
  // 成型野地数量太多，也算做基本地
]
, siteBase = 'http://magiccards.info'
, queryBase = 'http://magiccards.info/query'
, Datastore = require('nedb')
, dbFile = './db/info.db.bak'
, dbImgLib = './db/img.bak/'
, db = new Datastore({ filename: dbFile, autoload: true })
, DB = require('./db')
, guessLanguage = require('guessLanguage').guessLanguage;


// var detectLang = BPromise.promisify(guessLanguage.guessLanguage.detect);


const DEFAULT_DEST_LANG = 'cn';

const MAGICINFO_CONCURRENCY = 3;

const util = require('util');

const EventEmitter = require('events');



mkdirp.sync(dbImgLib);

dbImgLib = fs.realpathSync(dbImgLib);

db = BPromise.promisifyAll(db);


function Deck(opt) {

  // 设置输出语言
  this.destLang = _.get(opt, 'destLang', DEFAULT_DEST_LANG);

  // 解析输入牌表
  if (opt.hasOwnProperty('file')) {

    this.file  = opt.file;
    if (!fs.existsSync(this.file)) {
      throw '"file" not exists';
    }

    this.title = path.basename(this.file, '.txt');

    this.txt = fs.readFileSync(this.file).toString();

    this.list  = this.getList(this.txt);
  }
  else {
    // @todo check
    this.title = _.get(opt, 'title', moment().format('YYYYMMDD_HHmmss'));

    this.txt = opt.list;

    this.list = this.getList(this.txt);
  }

  // 设置图片输出路径（@todo 增加“是否输出图片”的选项）
  this.dir = './cards/' + this.title;

  this.imgList = [];

  // Initialize necessary properties from `EventEmitter` in this instance
  EventEmitter.call(this);

}

// Inherit functions from `EventEmitter`'s prototype
util.inherits(Deck, EventEmitter);

Deck.prototype.init = function() {

    var self = this;

    debug(self.txt);

    return detectLang(self.txt)
        .then(lang => {
            self.inputLang = lang;

            debug('@init', self.inputLang);

            return BPromise.resolve(self);
        })
        .catch(() => {
            // 检测不出语言，用中文
            // @todo 1. 遍历语言；
            //       2. 或者略过 DB，直接搜索网络
            debug('cannot detect lang');
            self.inputLang = 'cn';
            return BPromise.resolve(self);
        });
}


// @input String
// @output Object
Deck.prototype.getList = function(content) {

  var self = this,
      // \r\n - windows
      // \n   - unix
      list = {};

  content = content.split(/\r?\n/);

  this.content = content;
  // e.g.
  // 1 Dromoka's Command
  // 1 Collected Company
  // 2 Blossoming Sands
  // 2 Evolving Wilds
  // 1 Windswept Heath
  // 11 Plains
  // 10 Forest

  content.forEach(function(line) {

    debug(line);

    // 如果不是数字开头（如 Creatures、Sideboard），则 continue
    if (!line || ~~line[0] === 0) return;

    var card, count, pos;

    pos = line.indexOf(' ');

    card = line.slice(pos + 1);

    // 过滤基本地
    if (self.ignoreBasicLands && basicLands.indexOf(card) >= 0) {
      return;
    }

    count = line.slice(0, pos);

    debug('card count before', card, ~~list[card]);
    if (list.hasOwnProperty(card)) {
      list[card] = ~~list[card] + ~~count;
    }
    else {
      list[card] = count;
    }
    debug('card count after', card, ~~list[card]);

  });

  debug(list);
  // e.g.
  // {
  //   'Liliana, Heretical Healer': 1,
  //   'Honored Hierarch': 1
  // }

  return list;

}

Deck.prototype.genPDF = function(imgList) {


  var self = this;

  return new BPromise(function(resolve, reject) {

    debug('@genPDF', imgList);

    if (!imgList) {
      return; // no imgs
    }

    setTimeout(function() {

      var doc = new PDFDocument({
            size: 'A4'
          }),
          destFile = './cards/' + self.title + '.pdf';

      debug(destFile);

      var stream = fs.createWriteStream(destFile)
      doc.pipe(stream);


      var r = 1,
          c = 1;

      // 卡牌原始尺寸一般为 312 x 445（px）
      // A4: [595.28, 841.89]（不知什么单位）

      // 正合适的尺寸 3x3 为
      var cardWidth = 156,
          cardHeight = 222,
          paddingColumn = 31,
          paddingRow = 43,
          pageRow = 3,
          pageColumn = 3;


      // 按 4x4 打印
      // var cardWidth = 120,
      //     cardHeight = 171,
      //     paddingColumn = 23,
      //     paddingRow = 31,
      //     pageRow = 4,
      //     pageColumn = 4;

      for (let i = 0, l = imgList.length; i < l; i++) {

        debug('@add img', imgList[i]);

        doc.image(imgList[i], c * paddingColumn + (c-1) * cardWidth,
                  r * paddingRow + (r-1) * cardHeight, {
                    width: cardWidth,
                    height: cardHeight
                  })

        c += 1;

        if (c > pageColumn) {
          c = 1;
          r += 1;
        }

        if (r > pageRow && i < l) {
          r = 1;
          doc.addPage();
        }

      }

      debug('c, r', c, r);

      if (r === 3) {
        // 图占满了，牌表需要新加一页打印
        doc.addPage();
      }

      var textX = paddingColumn,
          // textY = 0;
          textY = 300; // 暂时 hardcode 确保 75 张牌时正确

      /*
        if (c < pageColumn) {
        r += 1;
        }
        textY = (r - 1) * (cardHeight + paddingRow) + paddingRow;
      */

      doc.text(self.title, textX, textY);

      // @todo content missing
      debug(self.content);
      doc.text(self.content.join('\n'), {columns: 2});

      doc.end();

      stream.on('finish', function() {
        debug('@pdf finish');
        resolve({
          file: destFile
        });
      });

    }, 2000);
  });
}

Deck.prototype.increaseDownloadProcess = function() {

  let self = this;

  debug('@increaseDownloadProcess 1', self.downloadProcess);

  self.downloadProcess += self.downloadProcessStep;

  debug('@increaseDownloadProcess 2', self.downloadProcess);

  self.emit('download process updated', self.downloadProcess);
}

Deck.prototype.dlPdf = function() {

  var self = this;


  self.downloadProcess = 0;
  // 取整算法比较粗略
  self.downloadProcessStep = Math.floor(100 / _.keys(self.list).length);

  // Creates an object with the same keys
  // var imgFilesPromises = _.mapValues(self.list, function(v, k) {
  //   return DB.findImgByTitleAndLang(k, self.inputLang, self.destLang);
  // });


  return new Promise(function(resolve, reject) {
    return BPromise.map(_.keys(self.list), cardTitle => {
      return DB.findImgByTitleAndLang(cardTitle, self.inputLang, self.destLang)
        .then((path) => {

          self.increaseDownloadProcess();

          return BPromise.resolve({
            title: cardTitle,
            path: path
          });
        });
    }, {concurrency: MAGICINFO_CONCURRENCY})
    .then(function(imgs) {
      debug('dlPdf got all imgs', imgs);
      // 组织 pdf

      var doc = new PDFDocument({
        size: 'A4'
      }),
          destFile = './cards/' + self.title + '.pdf';

      debug(destFile);

      var stream = fs.createWriteStream(destFile)
      doc.pipe(stream);

      var r = 1,
          c = 1;

      // 卡牌原始尺寸一般为 312 x 445（px）
      // A4: [595.28, 841.89]（不知什么单位）

      // 正合适的尺寸 3x3 为
      var cardWidth = 156,
          cardHeight = 222,
          paddingColumn = 31,
          paddingRow = 43,
          pageRow = 3,
          pageColumn = 3;


      // 按 4x4 打印
      // var cardWidth = 120,
      //     cardHeight = 171,
      //     paddingColumn = 23,
      //     paddingRow = 31,
      //     pageRow = 4,
      //     pageColumn = 4;


      for (var i = 0, l = imgs.length; i < l; i++) {
        var imgPath = imgs[i].path,
            title = imgs[i].title;


        debug('imgPath', imgPath);

        if (_.isNull(imgPath) || _.isUndefined(imgPath)) continue;

        for (var j = 1, n = self.list[title];
             j <= n; j++) {

          doc.image(imgPath, c * paddingColumn + (c-1) * cardWidth,
                    r * paddingRow + (r-1) * cardHeight, {
                      width: cardWidth,
                      height: cardHeight
                    })

          c += 1;

          if (c > pageColumn) {
            c = 1;
            r += 1;
          }

          if (r > pageRow) {
            r = 1;
            doc.addPage();
          }

        }

      }

      debug('c, r', c, r);

      if (_.has(self.inputLang) && self.inputLang === 'en') {
            debug('printing decklist');

      if (r === 3) {
        // 图占满了，牌表需要新加一页打印
        doc.addPage();
      }

      var textX = paddingColumn,
          // textY = 0;
          textY = 300; // 暂时 hardcode 确保 75 张牌时正确

      /*
        if (c < pageColumn) {
        r += 1;
        }
        textY = (r - 1) * (cardHeight + paddingRow) + paddingRow;
      */

      doc.text(self.title, textX, textY);

      // @todo content missing
      debug(self.content);
      doc.text(self.content.join('\n'), {columns: 2});

        }
      doc.end();

      stream.on('finish', function() {
        debug('@pdf finish');
        resolve({
          file: destFile
        });
      });

    });
  });
};

Deck.prototype.downloadImgs = function() {
  var self = this,
      imgs = Object.keys(self.list);


  mkdirp.sync(self.dir);

  // download 是一个 reduce 的操作
  return BPromise.reduce(imgs, function(imgList, img) {

    // debug('origin imglist', imgList);

    return self.getDbImgUrl(img)
      .then(function(url) {
        debug('@db ok ', url);

        // 如果能从 db 查到，则用 db
        return url;
      }, function(err) {
        debug('@db err', err);

        // 否则（db 查不到），则用网络
        // 网络最终也会返回本地文件
        return self.getImgUrl(img);

      })
      .then(function(cardFile) {

        // 之前用过 stream.pipe 的方案，
        // 但是异步 + async 不好用 promise
        for (var i = self.list[img]; i > 0; i--) {

          var file = self.getFilename(img, i),
              ws = fs.createWriteStream(file);

          debug(file);

          fse.copySync(cardFile, file)

          imgList.push(file);

          debug('img list', file);
        }

        return imgList;


      }, function(err) {
        debug(err);
        console.error(err);

        return imgList;
      });

  }, [])
  /*
  .then(function() {
    // @todo 需要检查图片储存机制，
    // 目前会造成 pdf 加图时图片未保存
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        resolve();
      }, 1000);
    });
  })
  */
  .then(self.genPDF.bind(self))


}

Deck.prototype.getDbFileName = function(img) {
  return dbImgLib + '/' + cardFileEscape(img) + '.jpg';
}

Deck.prototype.getFilename = function(img, i) {
  if (i === undefined) {
    i = 1;
  }

  return this.dir + '/' + cardFileEscape(img) + '_' + i + '.jpg';
}

Deck.prototype.getDbImgUrl = function(title) {

  return db.findAsync({title: title})
    .then(function(card) {
      debug('@db.find ok', card);

      return card[0].file;

    }, function(err) {
      debug('@db.find er', err);
    });

}

Deck.prototype.getImgUrl = function(title) {

  var card = {
    title: title
  },
      self = this;


  return request.get(queryBase)
    .query({
      // 严格按牌名搜索
      q: '!' + title
    })
    .then(function(res) {
      // 返回 html
      return res.text;
    })
    .then(function(html) {
      // 返回 $
      return cheerio.load(html);
    })
    .then(function($) {

      debug(title);

      // 返回英文图片链接
      var enImg = $("img[alt='" + title + "']"),
          enImgUrl;

      debug(enImg.html());
      enImgUrl = enImg.attr('src');
      debug(enImgUrl);

      if (!enImgUrl) {
        return BPromise.reject('cannot found "' + title + '"');
      }

      card.enImgUrl = enImgUrl;

      var cnImgUrl = enImgUrl.replace('/en/', '/' + self.destLang + '/');

      debug(cnImgUrl);

      // 如果当前版本没有中文图片，查找其他中文版
      return request.head(cnImgUrl)

        .then(function(res) {
          // 请求图片时，如果是 200，则下载

          debug('@head resolve');
          debug(res.status);
          debug(res.type);

          card.cnImgUrl = cnImgUrl;

          return cnImgUrl;

        }, function(err) {
          // 如果 404，则尝试下载英文图片
          // 但对于一些对决包，由于最新版本就是对决包，
          // 而对决包只有英文，所以可能图片都是英文
          //
          debug('@head reject');

          if (err.status === 404) {

            var cnCard = $('a[href*="/' + self.destLang + '/"]'),
                cnCardUrl,
                cnCardTitle;

            debug(cnCard.html());

            if (!cnCard.html()) {
              return BPromise.resolve(enImgUrl);
            }

            cnCardUrl = siteBase + cnCard.attr('href'),
            cnCardTitle = cnCard.text();

            return request.get(cnCardUrl)
              .then(function(res) {
                // 返回 html
                return res.text;
              })
              .then(function(html) {
                // 返回 $
                return cheerio.load(html);
              })
              .then(function($) {
                // 返回英文图片链接
                var cnImgUrl = $("img[alt='" + cnCardTitle + "']").attr('src');

                card.cnImgUrl = cnImgUrl;

                debug(cnImgUrl);

                return cnImgUrl;
              });

          }

          throw err;

        })

    })
    .then(function(url) {
      // save card

      return request.get(url)
        .then(function(res) {

          debug(res.type);

          // 下载图片
          // 复制牌张

          debug(title);

          var file = self.getDbFileName(title);
            fs.writeFileSync(file, res.body); // 写入文件 @todo async

          debug(file);

          card.file = file;

          debug(card.file);

        });
    })
    .then(function() {


      debug('@db saving', card);

      db.insert(card);

      return card.file;

    });
}

function cardFileEscape(cmd) {
  return cmd.replace('/', '_');
};

function detectLang(content) {


    return new BPromise(function(resolve, reject) {

        guessLanguage.detect(content, function(lang) {

            console.log(lang);

            var langMapping = {
                'zh':    'cn',
                'zh-TW': 'tw',
                'ja':    'jp'
            };
            if (langMapping.hasOwnProperty(lang)) {
                lang = langMapping[lang];
            }


            var avalLangs = [
                'en',       // en
                'de',       // de
                'fr',       // fr
                'it',       // it
                'es',       // es
                'pt',       // pt
                'ru',       // ru
                'ko',       // ko
                'jp',       // ja
                'cn',       // zh
                'tw'        // zh-TW guessLanguage.js 猜不出来
            ];
            if (avalLangs.indexOf(lang) < 0) {
                // @todo 处理未知 lang
                return reject('cannot detect input lang');
            }

            return resolve(lang);
        });

    });
}

module.exports = Deck;
