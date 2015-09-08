var debug = require('debug')('mtg:magiccards')
, siteBase = 'http://magiccards.info'
, queryBase = 'http://magiccards.info/query'
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, BPromise = require('bluebird')
;


function downloadCard(title) {

  var card = {};

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
      var pageTitle = $('title').text();

      // title 为搜索内容时（以 ! 开头），即未找到
      if (pageTitle[0] === '!') {
        return BPromise.reject('cannot found on magiccards');
      }

      return {
        title: pageTitle
      }
      // @todo

    });

  /*
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
  */

}

module.exports = {
  downloadCard: downloadCard
}
