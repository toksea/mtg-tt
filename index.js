// 通过 mtg 官网的 deck 语法，下载中文牌图片，以供打印、贴条
// 1 Honored Hierarch
// 2 Topan Freeblade
var Deck = require('./lib/deck'),
    fs = require('fs'),
    argv = require('minimist')(process.argv.slice(2)),
    deckFile = argv._[0],
    opt = {

        ignoreBasicLands: argv.b, // ignore basic lands

    };

// main
var d = new Deck({
    file: deckFile,
    inputLang: 'en',
    destLang: 'cn',
});

// d.downloadImgs()
// .then(function(ret) {
//     console.log(ret);
// });

d.init()
.then(function() {
    return d.dlPdf();
})
.then(function(ret) {
    console.log(ret);
});
