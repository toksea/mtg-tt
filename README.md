# mtg-tt
【万智牌】根据牌表下载图片、生成 PDF，供贴条打印用

## Usage
```
node index.js my_deck.txt
```

## Features
* 牌表要求为 mtg 官网格式，如

   ```
   4 Dark Confidant
   4 Tarmogoyf
   ```

* 卡牌会通过 http://magiccards.info/ 查找，下载过的牌会保存在本地
* 默认下载中文图片
* 下载后会生成 PDF
* 牌表（decklist）可参见
  * [Event decks](http://mtgsalvation.gamepedia.com/Event_deck)
  * [Clash packs](http://mtgsalvation.gamepedia.com/Clash_pack)
* 连体牌需使用其中一张的全名
  * 如 Wear/Tear 需使用 [Tear (Wear/Tear)](http://magiccards.info/dgm/en/135b.html)

## TODO
* FE 语言与 BE 语言 map 的问题：zh -> cn
* FE 识别出其他语言的处理：比如 unknown，另外，输入简体中文分别出现过 tl、sk
* 记录牌价
* 牌表录入支持多语言
* 支持输出目标语言的牌
* 可选则按一比一 3x3（会加水印）、小尺寸 3x3 和 4x4 输出，供 A4 纸打印
* 支持有选择的打印
* 整理 PDF 的牌表排版逻辑


### 大概有 promise 处理不当
```
Unhandled rejection Error: Unknown image format.
    at Function.PDFImage.open (~/mtg-tt/node_modules/pdfkit/js/image.js:41:15)
    at PDFDocument.module.exports.image (~/mtg-tt/node_modules/pdfkit/js/mixins/images.js:27:26)
    at Deck.genPDF (~/mtg-tt/lib/deck.js:156:9)
    at tryCatcher (~/mtg-tt/node_modules/bluebird/js/main/util.js:26:23)
    at Promise._settlePromiseFromHandler (~/mtg-tt/node_modules/bluebird/js/main/promise.js:503:31)
    at Promise._settlePromiseAt (~/mtg-tt/node_modules/bluebird/js/main/promise.js:577:18)
    at Promise._settlePromises (~/mtg-tt/node_modules/bluebird/js/main/promise.js:693:14)
    at Async._drainQueue (~/mtg-tt/node_modules/bluebird/js/main/async.js:123:16)
    at Async._drainQueues (~/mtg-tt/node_modules/bluebird/js/main/async.js:133:10)
    at Immediate.Async.drainQueues [as _onImmediate] (~/mtg-tt/node_modules/bluebird/js/main/async.js:15:14)
    at processImmediate [as _immediateCallback] (timers.js:367:17)
```

## electron

http://electron.atom.io

http://electron.atom.io/docs/latest/tutorial/quick-start/
https://github.com/atom/electron/releases 下载 electron-v0.31.0-darwin-x64.zip
http://electron.atom.io/docs/v0.31.0/tutorial/application-distribution/



