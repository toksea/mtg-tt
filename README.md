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
* 数据库记录牌价
* 需要限制下载速度，以防被封
* 支持不同语言输入、输出（图片）

