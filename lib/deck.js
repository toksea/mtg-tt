var BPromise = require('bluebird')
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, debug = require('debug')('mtg')
, fs = require('fs')
, path = require('path')
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
, queryBase = 'http://magiccards.info/query';


function Deck(file) {

  // @todo 检查文件是否存在
  this.file = file;

  this.title = path.basename(file, '.txt');

  this.dir = './cards/' + this.title;

  this.list = this.getList();

  this.imgList = [];
}

Deck.prototype.getList = function() {
  var self = this,
      content = fs.readFileSync(this.file).toString().split(/\r?\n/),
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

Deck.prototype.genPDF = function(imgList) {


  debug(imgList);

  if (!imgList) {
    return; // no imgs
  }

  var self = this,
      doc = new PDFDocument({
      size: 'A4'
  }),
      destFile = './cards/' + self.title + '.pdf';

  debug(destFile);

  doc.pipe(fs.createWriteStream(destFile));


  var r = 1,
      c = 1;

  // 卡牌原始尺寸一般为 312 x 445（px）
  // A4: [595.28, 841.89]（不知什么单位）

  // 正合适的尺寸 3x3 为
  // var cardWidth = 156,
  //     cardHeight = 222,
  //     paddingColumn = 31,
  //     paddingRow = 43,
  //     pageRow = 3,
  //     pageColumn = 3;


  // 按 4x4 打印
  var cardWidth = 120,
      cardHeight = 171,
      paddingColumn = 23,
      paddingRow = 31,
      pageRow = 4,
      pageColumn = 4;

  for (var i = 0, l = imgList.length; i < l; i++) {

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

    if (r > pageRow) {
      r = 1;
      doc.addPage();
    }

  }

  doc.end();

}

Deck.prototype.downloadImgs = function() {
  var self = this,
      imgs = Object.keys(self.list);


  mkdirp.sync(self.dir);

  // download 是一个 reduce 的操作
  return BPromise.reduce(imgs, function(imgList, img) {

    return self.getImgUrl(img)
      .then(function(url) {

        debug(url);

        return request.get(url)
          .then(function(res) {

            debug(res.type);

            // 下载图片
            // 复制牌张

            debug(img);

            for (var i = self.list[img]; i > 0; i--) {

              var file = self.getFilename(img, i);
              fs.writeFileSync(file, res.body);

              imgList.push(file);

              debug('pushed', file);
            }

            return imgList;

          });

      }, function(err) {
        debug(err);
        console.error(err);

        return imgList;
      });

  }, []).then(self.genPDF.bind(self));

}

Deck.prototype.getFilename = function(img, i) {
  if (i === undefined) {
    i = 1;
  }

  return this.dir + '/' + img + '_' + i + '.jpg';
}

Deck.prototype.getImgUrl = function(title) {

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

      var cnImgUrl = enImgUrl.replace('/en/', '/cn/');

      debug(cnImgUrl);

      // 如果当前版本没有中文图片，查找其他中文版
      return request.head(cnImgUrl)

        .then(function(res) {
          // 请求图片时，如果是 200，则下载

          debug('@head resolve');
          debug(res.status);
          debug(res.type);

          return cnImgUrl;

        }, function(err) {
          // 如果 404，则尝试下载英文图片
          // 但对于一些对决包，由于最新版本就是对决包，
          // 而对决包只有英文，所以可能图片都是英文

          debug('@head reject');

          if (err.status === 404) {

            var cnCard = $('a[href*="/cn/"]'),
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

                debug(cnImgUrl);

                return cnImgUrl;
              });

          }

          throw err;

        })

    });
}

module.exports = Deck;
