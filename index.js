// 通过 mtg 官网的 deck 语法，下载中文牌图片，以供打印、贴条
// 1 Honored Hierarch
// 2 Topan Freeblade
var Deck = require('./lib/deck'),
    fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    deckFile = argv._[0];


// main
var d = new Deck(deckFile);

// @todo 需要增加 404 处理，比如
// http://magiccards.info/query?q=Pacifism
// 会到特殊版本的和平主义
// http://magiccards.info/ddadvd/en/17.html
// 而此版本是无中文图片的，须有办法找到恰当的中文图

// @todo 增加牌价

// @todo 需要限制下载速度，以防被封
d.downloadImgs();
