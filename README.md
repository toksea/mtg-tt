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
  * 如 Wear/Tear 需使用 [[http://magiccards.info/dgm/en/135b.html|Tear (Wear/Tear)]]

## TODO
* 记录牌价
* 牌表录入支持多语言
* 支持输出目标语言的牌
* 可选则按一比一 3x3（会加水印）、小尺寸 3x3 和 4x4 输出，供 A4 纸打印
* 支持有选择的打印
