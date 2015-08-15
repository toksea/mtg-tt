var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg')
, fs = require('fs')
, path = require('path');


function Deck(file) {

  // @todo 检查文件是否存在
  this.file = file;

  this.queryBase = 'http://magiccards.info/query';

  this.title = path.basename(file, '.txt');

  this.dir = './decks/' + this.title;

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

  fs.mkdirSync(self.dir);

  BPromise.each(imgs, function(img) {
    self.getImgUrl(img)
      .then(function(url) {
        var file = self.dir + '/' + img + '.jpg',
            stream = fs.createWriteStream(file);

        debug(file);

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

      debug(cnImgUrl);
      return cnImgUrl;
    });
}


module.exports = Deck;
