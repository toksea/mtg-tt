'use strict';

var debug = require('debug')('mtg:magiccards')
, siteBase = 'http://magiccards.info'
, queryBase = 'http://magiccards.info/query'
, request = require('superagent-bluebird-promise')
, cheerio = require('cheerio')
, BPromise = require('bluebird')
, langMapping = {               // 注释为 guessLanguage.js 的语言标志
  English: 'en',                // en
  German:  'de',                // de
  French:  'fr',                // fr
  Italian: 'it',                // it
  Spanish: 'es',                // es
  Portuguese: 'pt',             // pt
  Russian: 'ru',                // ru
  Korean:  'ko',                // ko
  Japanese:   'jp',             // ja
  'Simplified Chinese':  'cn',  // zh
  'Traditional Chinese': 'tw',  // zh-TW guessLanguage.js 猜不出来
}
, fs = require('fs')
;


function downloadCard(title) {

  debug('@downloadCard', title);

  /*
  return BPromise.resolve({ titles:
           { en: 'Island',
             de: 'Insel',
             fr: 'Île',
             it: 'Isola',
             es: 'Isla',
             pt: 'Ilha',
             jp: '島',
             cn: '海岛',
             ru: 'Остров',
             tw: '海島',
             ko: '섬' },
           links:
           { en: '/ori/en/257.html',
             de: '/ori/de/257.html',
             fr: '/ori/fr/257.html',
             it: '/ori/it/257.html',
             es: '/ori/es/257.html',
             pt: '/ori/pt/257.html',
             jp: '/ori/jp/257.html',
             cn: '/ori/cn/257.html',
             ru: '/ori/ru/257.html',
             tw: '/ori/tw/257.html',
             ko: '/ori/ko/257.html' } });
  */

  var card = {};

  debug('request.get', queryBase);

  return request.get(queryBase)
    .set('Set-Cookie', 'lang=en')
    .query({
      // 严格按牌名搜索
      q: '!' + title
    })
    .then((res) => {
      // 返回 html
      return res.text;
    })
    .then((html) => {
      // debug(html);
      // 返回 $
      return cheerio.load(html);
    })
    .then(($) => {


      let pageTitle = $('title').text();

      // title 为搜索内容时（以 ! 开头），即未找到
      if (pageTitle[0] === '!') {
        return BPromise.reject('cannot found on magiccards');
      }


      let titles = {},
          links = {},
          currentLang,
          currentLangTitle,
          currentLangLink,
          currentLangShort;



      // 处理当前语言
      currentLang = $('img.flag').attr('alt');


      let currentLangA = $('img.flag').parent().find('a');
      currentLangLink = currentLangA.attr('href');
      currentLangTitle = currentLangA.text();
      // currentLangTitle 使用页面中的内容，避免用户输入时大小写不对
      // 造成的数据库数据大小写不对

      currentLangShort = langMapping[currentLang];

      titles[currentLangShort] = currentLangTitle;
      links[currentLangShort] = currentLangLink;

      // 处理所有其他语言，
      // ~ 为 Next Siblings Selector，
      // 选择包含文字 “Languages:” 的 <u> 之后的所有 img.flag2
      $('u:contains("Languages:") ~ img.flag2').each((index, element) => {

        let $langImg = $(element),
            lang = langMapping[$(element).attr('alt')],
            $link = $langImg.next();

        if ($link.is('a')) {
          titles[lang] = $link.text();
          links[lang] = $link.attr('href');
        }
        else {
          // unknown error
        }

      });

      return {
        titles: titles,
        links: links
      };

    });
}

function downloadCardImg(url, title) {
  debug('request.get', siteBase + url);

  return request.get(siteBase + url)
    .then((res) => {
      // 返回 html
      return res.text;
    })
    .then((html) => {
      // debug(html);
      // 返回 $
      return cheerio.load(html);
    })
    .then(($) => {
      var $img = $("img[alt='" + title + "']"),
          imgUrl = $img.attr('src');


      debug(imgUrl);

      return imgUrl;
    })
    .then(imgUrl => {
      // @todo 下载图片这部分要不要放到 db.js

      debug('request.get', imgUrl);

      return request.get(imgUrl)
        .then(res => {

          let file = getDbFileName(title);

          debug(file);

          fs.writeFileSync(file, res.body);

          return BPromise.resolve(file);
        });

    });


  // return BPromise.resolve('/Users/xp/Code/mtg-tt/db/img/Island.jpg');

}

function cardFileEscape(file) {
  return file.replace('/', '_');
};

function getDbFileName(img) {
  let dbImgLib = './db/img';

  // return fs.realpathSync(dbImgLib + '/' + cardFileEscape(img) + '.jpg');
  // realpath 会 lstat 文件，而非模拟补全，所以文件不存在时会出错，暂不用 realpath 了
  return dbImgLib + '/' + cardFileEscape(img) + '.jpg';
}

module.exports = {
  downloadCard: downloadCard,
  downloadCardImg: downloadCardImg
}
