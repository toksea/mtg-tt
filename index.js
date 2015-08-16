// 通过 mtg 官网的 deck 语法，下载中文牌图片，以供打印、贴条
// 1 Honored Hierarch
// 2 Topan Freeblade
var Deck = require('./lib/deck'),
    fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    deckFile = argv._[0];


// main
var d = new Deck(deckFile);

// @todo 增加牌价

// @todo 根据牌张（除基本地），复制图片

// @todo 需要限制下载速度，以防被封

// @todo 支持不同语言输入、输出（图片）

d.downloadImgs();
