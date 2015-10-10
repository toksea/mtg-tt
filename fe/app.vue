<template>
  <div id="layout">
    <!-- Menu toggle -->
    <a href="#menu" id="menuLink" class="menu-link">
      <!-- Hamburger icon -->
      <span></span>
    </a>

    <div id="menu">
      <div class="pure-menu">
        <a class="pure-menu-heading" href="/"
           data-step="1" data-intro="这是一个用来下载万智牌贴条的工具">mtg-tt</a>

        <ul class="pure-menu-list">
            <li class="pure-menu-item pure-menu-selected">
                <a href="#" class="pure-menu-link">
                    打印牌表
                </a>
            </li>
            <li class="pure-menu-item">
                <a href="#" class="pure-menu-link" data-step="5"
                data-intro="在这里还能下载流行牌表">
                    流行牌表
                </a>
            </li>
            <li class="pure-menu-item">
                <a href="#" class="pure-menu-link"
                   v-on="click: showTut">
                    怎么用？
                </a>
            </li>
            <li class="pure-menu-item menu-item-divided">
                <a href="https://github.com/toksea/mtg-tt"
                   target="_blank" class="pure-menu-link"
                   data-step="6"
                   data-intro="如果你是程序猿，欢迎在 GitHub 上交流">
                    GitHub
                </a>
            </li>
        </ul>
      </div>
    </div>

    <div id="main">

      <div id="xs-header" class="header">
        <h1>mtg-tt</h1>
        <h2>A subtitle for your page goes here</h2>
      </div>

      <div class="content">

        <form id="deck-form" class="pure-g pure-form pure-form-stacked"
              v-on="submit: submit">

          <div class="pure-u-1 pure-u-sm-3-5 my-column">

            <input type="text" class="pure-input-1" placeholder="标题"
                   v-model="title" data-step="2"
                   data-intro="输入你的套牌名称" required lazy>
            <textarea class="pure-input-1" placeholder="牌表"
                      rows="20" v-model="list" data-step="3"
                      data-intro="再输入牌表。支持中、英等所有出版过万智牌的语言。<br/>请按“数量空格名称”的格式输入，如“20 海岛”" required lazy></textarea>

          </div>
          <!-- 大于 768px 时占 2/5，小于 768px 时占一行， -->
          <div class="pure-u-1 pure-u-sm-2-5 my-column">


          <fieldset class="pure-group">

            <label for="lang">下载什么语言的牌？</label>
            <select id="lang" v-model="lang" options="langs">
            </select>

            <!--
            <label>版式</label>

            <label for="layout-3x3" class="pure-radio">
              <input id="layout-3x3" type="radio"
                     v-model="layout" name="layout" value="3x3" checked>
              3x3
            </label>
            <label for="layout-4x4" class="pure-radio">
              <input id="layout-4x4" type="radio"
                     v-model="layout" name="layout" value="4x4">
              4x4
            </label>
            --!>

            <button type="submit"
                    class="pure-button pure-button-primary" data-step="4"
                    data-intro="点此就能下载 Pdf 了。生成 Pdf 需要 1 分钟左右，请耐心等待">
                    下载</button>
          </fieldset>

          <ul>
              <li
                v-repeat="dl in downloadList"
                v-transition="expand"
              >
                  {{dl.title}} {{dl.process}}% <a v-show="dl.url" target="_blank" href="{{dl.url}}">下载</a>
              </li>
          </ul>
          </div>
        </form>
      </div>
</template>
<script>
var introJs = require('intro.js/intro.js').introJs,
    introJsCss = require('intro.js/introjs.css');

module.exports = {
    el: '#app',
    data: {
        title:  null,
        list:   null,
        langs: [
            {text: '中文', value: 'cn'},
            {text: 'English', value: 'en'},
            {text: 'Français', value: 'fr'},
            {text: 'Español', value: 'es'},
            {text: 'Deutsch', value: 'de'},
            {text: 'Italiano', value: 'it'},
            {text: 'Português', value: 'pt'},
            {text: 'Русский', value: 'ru'},
            {text: '한국어', value: 'ko'},
            {text: '日本語', value: 'jp'},
            {text: '正體', value: 'tw'}
        ],
        lang:   'cn',
        layout: '3x3',
        downloadUrl: '#',
        downloadList: []
    },
    methods: {
        showTut: function(e) {
            e.preventDefault();

            // 需注意，data-step 不能按 10、20 命名
            introJs().start();

        },
        submit: function(e) {
            e.preventDefault();

            var self = this;

            var did = Date.now();

            var data = this.$data;

            data.did = did;

            // 明确定义的数据模型更加适合 Vue 的数据观察模式。建议在定义
            // 组件时，在 data 选项中初始化所有需要进行动态观察的属性。
            // http://cn.vuejs.org/guide/best-practices.html#数据初始化

            console.log('pushing', this.downloadList);

            this.downloadList.push({
                did: did,
                title: data.title,
                process: 0,
                url: ""
            });

            self.socket.emit('form submit', data);

            this.$data.title = null;
            this.$data.list = null;

        }
    },
    ready: function() {

        var self = this;
        var i = 0;
        var l = 0;

        // 如果更组件化，需要在组件间 share io，可参考：
        // https://github.com/yyx990803/vue/issues/979
        self.socket = require('socket.io-client')();

        // @todo 使用对象记录下载列表
        self.socket.on('download process updated', function(data) {

            for (i = 0, l = self.downloadList.length; i < l; i += 1) {
                console.log(data);

                if (self.downloadList[i].did != data.did) {
                    continue;
                }

                self.downloadList[i].process = data.process;

            }

        });
        self.socket.on('downloaded', function(data) {

            console.log('data', data);

            if (data.ok) {

                for (i = 0, l = self.downloadList.length; i < l; i += 1) {
                    console.log(self.downloadList[i].did);
                    console.log(self.downloadList[i].title);

                    if (self.downloadList[i].did != data.did) {
                        continue;
                    }

                    console.log('down');

                // 自动下载，并显示“若未自动下载，点此下载”
                var downloadUrl = data.path;

                // self.downloadUrl = downloadUrl;

                // var downloadButton = document.getElementById('download-pdf');

                    // mvvm 生效需要时间，生效后，再下载
                    self.downloadList[i].process = 100;
                    self.downloadList[i].url = downloadUrl;

                    // @todo 自动下载（需浏览器允许弹窗）
                    // downloadButton.click();

                }


            } else {
                alert('Oh no! error ' + data.text);
            }
        });
    }
}
</script>

<style>
/* http://purecss.io/layouts/side-menu/ */

#app {
    color: #777;
}

.pure-img-responsive {
    max-width: 100%;
    height: auto;
}

/*
Add transition to containers so they can push in and out.
*/
#layout,
#menu,
.menu-link {
    -webkit-transition: all 0.2s ease-out;
    -moz-transition: all 0.2s ease-out;
    -ms-transition: all 0.2s ease-out;
    -o-transition: all 0.2s ease-out;
    transition: all 0.2s ease-out;
}

/*
This is the parent `<div>` that contains the menu and the content area.
*/
#layout {
    position: relative;
    padding-left: 0;
}
    #layout.active #menu {
        left: 150px;
        width: 150px;
    }

    #layout.active .menu-link {
        left: 150px;
    }
/*
The content `<div>` is where all your content goes.
*/
.content {
    margin: 0 auto;
    padding: 0 2em;
    max-width: 800px;
    margin-bottom: 50px;
    line-height: 1.6em;
}

.header {
     margin: 0;
     color: #333;
     text-align: center;
     padding: 2.5em 2em 0;
     border-bottom: 1px solid #eee;
 }
    .header h1 {
        margin: 0.2em 0;
        font-size: 3em;
        font-weight: 300;
    }
     .header h2 {
        font-weight: 300;
        color: #ccc;
        padding: 0;
        margin-top: 0;
    }

.content-subhead {
    margin: 50px 0 20px 0;
    font-weight: 300;
    color: #888;
}



/*
The `#menu` `<div>` is the parent `<div>` that contains the `.pure-menu` that
appears on the left side of the page.
*/

#menu {
    margin-left: -150px; /* "#menu" width */
    width: 150px;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1000; /* so the menu or its navicon stays above all content */
    background: #191818;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}
    /*
    All anchors inside the menu should be styled like this.
    */
    #menu a {
        color: #999;
        border: none;
        padding: 0.6em 0 0.6em 0.6em;
    }

    /*
    Remove all background/borders, since we are applying them to #menu.
    */
     #menu .pure-menu,
     #menu .pure-menu ul {
        border: none;
        background: transparent;
    }

    /*
    Add that light border to separate items into groups.
    */
    #menu .pure-menu ul,
    #menu .pure-menu .menu-item-divided {
        border-top: 1px solid #333;
    }
        /*
        Change color of the anchor links on hover/focus.
        */
        #menu .pure-menu li a:hover,
        #menu .pure-menu li a:focus {
            background: #333;
        }

    /*
    This styles the selected menu item `<li>`.
    */
    #menu .pure-menu-selected {
        background: #1f8dd6;
    }
        /*
        This styles a link within a selected menu item `<li>`.
        */
        #menu .pure-menu-selected a {
            color: #fff;
        }

    /*
    This styles the menu heading.
    */
    #menu .pure-menu-heading {
        font-size: 110%;
        color: #fff;
        margin: 0;
    }

/* -- Dynamic Button For Responsive Menu -------------------------------------*/

/*
The button to open/close the Menu is custom-made and not part of Pure. Here's
how it works:
*/

/*
`.menu-link` represents the responsive menu toggle that shows/hides on
small screens.
*/
.menu-link {
    position: fixed;
    display: block; /* show this only on small screens */
    top: 0;
    left: 0; /* "#menu width" */
    background: #000;
    background: rgba(0,0,0,0.7);
    font-size: 10px; /* change this value to increase/decrease button size */
    z-index: 10;
    width: 2em;
    height: auto;
    padding: 2.1em 1.6em;
}

    .menu-link:hover,
    .menu-link:focus {
        background: #000;
    }

    .menu-link span {
        position: relative;
        display: block;
    }

    .menu-link span,
    .menu-link span:before,
    .menu-link span:after {
        background-color: #fff;
        width: 100%;
        height: 0.2em;
    }

        .menu-link span:before,
        .menu-link span:after {
            position: absolute;
            margin-top: -0.6em;
            content: " ";
        }

        .menu-link span:after {
            margin-top: 0.6em;
        }


/* -- Responsive Styles (Media Queries) ------------------------------------- */

/*
Hides the menu at `48em`, but modify this based on your app's needs.
*/
@media (min-width: 48em) {

    .header,
    .content {
        padding-left: 2em;
        padding-right: 2em;
    }

    #layout {
        padding-left: 150px; /* left col width "#menu" */
        left: 0;
    }
    #menu {
        left: 150px;
    }

    .menu-link {
        position: fixed;
        left: 150px;
        display: none;
    }

    #layout.active .menu-link {
        left: 150px;
    }

    #xs-header {
        display: none;
    }

}

@media (max-width: 48em) {
    /* Only apply this when the window is small. Otherwise, the following
    case results in extra padding on the left:
        * Make the window small.
        * Tap the menu to trigger the active state.
        * Make the window large again.
    */
    #layout.active {
        position: relative;
        left: 150px;
    }

    #xs-header {
        display: block;
    }
}

/* http://purecss.io/grids/#applying-padding-and-borders-to-grid-units */
    .pure-g > div {
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }
    .my-column {
        padding: 1em;
    }

/* 下载列表出现时的动画效果 */
.expand-transition {
  transition: all .3s ease;
}
.expand-enter, .expand-leave {
  height: 0;
  padding: 0 10px;
  opacity: 0;
  background: yellow;
}
</style>
