'use strict';

var app = require('./app');

app.listen(process.env.PORT || 3002, function() {
    console.log('Server listening on http://localhost:%d', this.address().port);
});
