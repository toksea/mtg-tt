// main.js
var Vue = require('vue')
var appOptions = require('./app.vue')
var app = new Vue(appOptions).$mount('#app')


require('purecss/build/pure-min.css');
// 响应式需单独 require
require('purecss/build/grids-responsive-min.css');
