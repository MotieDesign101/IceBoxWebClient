var express = require('express');
var app = express();
var path = require('path');
var bonjour = require('bonjour')();
var exec = require('exec');

bonjour.find({
    type: 'http'
  }, function(service) {
    console.log(JSON.stringify(service.host));
    if (service.name == 'IceBox') {
      app.get('/serviceip', function(req, res) {
        res.json({ ip: service.host });
      });
      app.get('/doreset', function(req, res) {
        console.log("calling reset.");
        exec('/root/redeployservice.sh', function(a, b, c) {
          console.log("1");
        });
      });
      app.listen(80);
    }
  });

  app.get('/', function(req, res) {
    app.use(express.static('./image'));
    res.sendFile(path.join(__dirname + '/index.html'));
  });

  app.get('/isiceboxdown', function(req, res) {
    res.sendFile(path.join(__dirname + '/reset.html'));
  });
