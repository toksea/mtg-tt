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
    
    BPromise = require('bluebird'),
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

    d.downloadImgs();


    res.json('hehe');
});
    
module.exports = app;
