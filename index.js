// 通过 mtg 官网的 deck 语法，下载中文牌图片，以供打印、贴条
// 1 Honored Hierarch
// 2 Topan Freeblade
var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg')
, fs = require('fs');


function Deck(title, list) {

  this.queryBase = 'http://magiccards.info/query';

  this.title = title;

  this.dir = './decks/' + this.title;

  this.list = list;
  // e.g.
  // {
  //   'Liliana, Heretical Healer': 1,
  //   'Honored Hierarch': 1
  // }
}

Deck.prototype.downloadImgs = function() {
  var self = this,
      imgs = Object.keys(self.list);

  fs.mkdirSync(self.dir);

  BPromise.each(imgs, function(img) {
    self.getImgUrl(img)
      .then(function(url) {
        var file = self.dir + '/' + img + '.jpg',
            stream = fs.createWriteStream(file);

        console.log(file);

        request.get(url)
          .pipe(stream);
      });
  });
}

Deck.prototype.getImgUrl = function(title) {

  return request.get(this.queryBase)
    .query({
      q: title
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

      console.log(cnImgUrl);
      return cnImgUrl;
    });
}


// main
var d = new Deck('hehe', {
  'Liliana, Heretical Healer': 1,
  'Honored Hierarch': 1
});

d.downloadImgs();
