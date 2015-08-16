var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg')
, fs = require('fs')
, path = require('path')
, mkdirp = require('mkdirp')
, basicLands = [
  'Plains',
  'Island',
  'Swamp',
  'Mountain',
  'Forest',
  'Evolving Wilds'
  // 成型野地数量太多，也算做基本地
];

function Deck(file) {

  // @todo 检查文件是否存在
  this.file = file;

  this.queryBase = 'http://magiccards.info/query';

  this.title = path.basename(file, '.txt');

  this.dir = './cards/' + this.title;

  this.list = this.getList();
}

Deck.prototype.getList = function() {
  var content = fs.readFileSync(this.file).toString().split(/\r?\n/),
      // \r\n - windows
      // \n   - unix
      list = {};

  debug(content);
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

    if (!line) return;

    var card, count, pos;

    pos = line.indexOf(' ');

    card = line.slice(pos + 1);

    // 过滤基本地
    if (basicLands.indexOf(card) >= 0) {
      return;
    }

    count = line.slice(0, pos);

    list[card] = count;
  });

  debug(list);
  // e.g.
  // {
  //   'Liliana, Heretical Healer': 1,
  //   'Honored Hierarch': 1
  // }

  return list;

}

Deck.prototype.downloadImgs = function() {
  var self = this,
      imgs = Object.keys(self.list);


  mkdirp.sync(self.dir);

  BPromise.each(imgs, function(img) {
    self.getImgUrl(img)
      .then(function(urls) {

        debug(urls);

        request.get(urls[0])
          .then(function(res) {
            // 请求图片时，如果是 200，则下载

            debug(res.status);
            debug(res.type);

            return res;

          }, function(err) {
            // 如果 404，则尝试下载英文图片
            // 但对于一些对决包，由于最新版本就是对决包，
            // 而对决包只有英文，所以可能图片都是英文

            if (err.status === 404) {

              return request.get(urls[1]);

            }

            throw err;

          })
          .then(function(res) {

            debug(res.type);

            // 下载图片
            // 复制牌张
            for (var i = self.list[img]; i > 0; i--) {

              fs.writeFileSync(self.getFilename(img, i), res.body);
            }

          });

      });
  });
}

Deck.prototype.getFilename = function(img, i) {
  if (i === undefined) {
    i = 1;
  }

  return this.dir + '/' + img + '_' + i + '.jpg';
}

Deck.prototype.getImgUrl = function(title) {

  return request.get(this.queryBase)
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
      // 返回英文图片链接
      return $("img[alt='" + title + "']").attr('src');
    })
    .then(function(enImgUrl) {
      // http://magiccards.info/scans/en/ori/106a.jpg
      // => 转为中文图片链接
      // http://magiccards.info/scans/cn/ori/106a.jpg

      var cnImgUrl = enImgUrl.replace('/en/', '/cn/');

      debug(cnImgUrl);

      // 如果没有中文图片，可用英文图片
      return [cnImgUrl, enImgUrl];
    });
}

module.exports = Deck;
