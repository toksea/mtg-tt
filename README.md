# mtg-tt
【万智牌】根据牌表下载图片、生成 PDF，供贴条打印用

## Usage
### 命令行
```
node index.js my_deck.txt
```
### 网页
1. 安装 webpack
2. webpack
3. 启动

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
* 牌表录入支持多语言
* 支持选择下载的牌的语言

## TODO
* 记录牌价
* 可选则按一比一 3x3（会加水印）、小尺寸 3x3 和 4x4 输出，供 A4 纸打印
* 支持有选择的打印
* 整理 PDF 的牌表排版逻辑
* 由于下载时间可能较长，网站应使用 socket.io 做推送，重新设计 UX

## electron

http://electron.atom.io

http://electron.atom.io/docs/latest/tutorial/quick-start/
https://github.com/atom/electron/releases 下载 electron-v0.31.0-darwin-x64.zip
http://electron.atom.io/docs/v0.31.0/tutorial/application-distribution/



