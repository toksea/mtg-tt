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

var app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

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

    var d = new Deck({
        title: body.title,
        list:  body.list,
        inputLang: body.inputLang,
        // @todo 确认 inputLang 在前端输入，还是后端自动检测
        // 1. 用户输入较少时，无法正常检测出语言
        // 2. 前端输入的话，可以在检测不出语言时，提示用户手动选择

        // @todo lang detect 的语言要和 mtg 的语言 map
        destLang: body.lang
    });

    d.dlPdf()
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


io.on('connection', function(socket){
    console.log('a user connected',
                // socket.request.protocol, // undefined
                socket.request.headers.host // localhost:3002
               );

    var dlUrlRoot = 'http://' + socket.request.headers.host + '/download/';

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });


    socket.on('form submit', (data) => {

        console.log('@form submit');
        console.log(data);


        debug(data);
        debug(typeof data);

        var body = data;

        debug(body);

        debug(body.title);
        debug(body.list);

        var d = new Deck({
            title: body.title,
            list:  body.list,
            // inputLang: body.inputLang,
            // @todo 确认 inputLang 在前端输入，还是后端自动检测
            // 1. 用户输入较少时，无法正常检测出语言
            // 2. 前端输入的话，可以在检测不出语言时，提示用户手动选择

            // @todo lang detect 的语言要和 mtg 的语言 map
            destLang: body.lang
        });

        d.on('download process updated', (p) => {
            debug('download process updated', p);

            socket.emit('download process updated', {
                did: body.did,
                process: p
            });
        });

        d.init()
            .then(function() {
                return d.dlPdf();
            })
            .then(function(ret) {

                debug(ret);

                // 把文件复制到可下载目录
                var dlDir = './public/download',
                    dlFile = moment().format('YYYYMMDD_HHmmss') + '.pdf',
                    dlPath = dlDir + '/' + dlFile,
                    dlUrl = dlUrlRoot + dlFile;

                mkdirp.sync(dlDir);

                fse.copySync(ret.file, dlPath);

                // res.json(dlUrl);
                debug('downloaded', dlUrl);
                socket.emit('downloaded', {
                    did: body.did,
                    ok: true,
                    path: dlUrl
                });
            })


    });
});

module.exports = http;
