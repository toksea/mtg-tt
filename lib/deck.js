var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg')
, fs = require('fs')
, path = require('path')
, mkdirp = require('mkdirp');


// @todo 需要增加 404 处理，比如
// http://magiccards.info/query?q=Pacifism
// 会到特殊版本的和平主义
// http://magiccards.info/ddadvd/en/17.html
// 而此版本是无中文图片的
// 1. 须有办法找到恰当的中文图
// 2. 或直接用英文的

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

  mkdirp.sync(self.dir);

  BPromise.each(imgs, function(img) {
    self.getImgUrl(img)
      .then(function(urls) {

        debug(urls);

        var file = self.dir + '/' + img + '.jpg';
            // stream = fs.createWriteStream(file);

        debug(file);

        request.get(urls[0])
          .then(function(res) {
            // 请求图片时，如果是 200，则下载

            debug(res.status);
            debug(res.type);

            return res;

          }, function(err) {
            // 如果 404，则尝试下载英文图片

            if (err.status === 404) {

              return request.get(urls[1]);

            }

            throw err;

          })
          .then(function(res) {

            // 下载图片
            debug(res.type);
            fs.writeFileSync(file, res.body);

          });

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

      // 如果没有中文图片，可用英文图片
      return [cnImgUrl, enImgUrl];
    });
}

module.exports = Deck;
