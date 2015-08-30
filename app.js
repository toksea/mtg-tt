'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    staticOptions = {
        dotfiles: 'ignore',
        etag: false,
        // extensions: ['htm', 'html'],
        // index: false, // default index.html
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res, path, stat) {
            res.set('x-timestamp', Date.now());
        }
    },

    mkdirp = require('mkdirp'),
    BPromise = require('bluebird'),
    moment = require('moment'),
    fse = require('fs-extra'),
    debug = require('debug')('mtg'),
    Deck = require('./lib/deck');


var app = express();

// for parsing application/json
app.use(bodyParser.json());
// for parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));


app.use(express.static('public', staticOptions));



app.post('/print', function(req, res) {

    debug(req.body);
    debug(typeof req.body);

    var body = req.body;

    debug(body);

    debug(body.title);
    debug(body.list);

    var d = new Deck({title: body.title,
                      list:  body.list});

    d.downloadImgs()
    .then(function(ret) {

        debug(ret);

        // 把文件复制到可下载目录
        var dlDir = './public/download',
            dlFile = moment().format('YYYYMMDD_HHmmss') + '.pdf',
            dlPath = dlDir + '/' + dlFile,
            dlUrl = req.protocol + '://' + req.get('Host') + '/download/' + dlFile;

        mkdirp.sync(dlDir);

        fse.copySync(ret.file, dlPath);

        res.json(dlUrl);
    })
});

module.exports = app;
