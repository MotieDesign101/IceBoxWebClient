var express = require('express');
var app = express();
var path = require('path');
var cors = require('cors');
var bonjour = require('bonjour')();
var exec = require('exec');

cors({
  credentials: true,
  origin: true
});
app.use(cors()); // Support cross origin requests

bonjour.find(
  { type: 'http' },
  function(service) {
    console.log(JSON.stringify(service));
    if (service.name == 'IceBox') {
      app.get('/serviceip', function(req, res) {
        res.json({ ip: service.host, port: service.port });
      });
      app.get('/doreset', function(req, res) {
        console.log("calling reset.");
        exec('./restart.sh', function(a, b, c) {
          exec('./restart.sh', function(a, b, c) {
            res.json({ok: true});
          });
        });
      });
    }
  });

app.get(
  '/',
  function(req, res) {
    app.use(express.static(__dirname + '/static'));
    res.sendFile(path.join(__dirname + '/static/index.html'));
  });

app.get(
  '/isiceboxdown',
  function(req, res) {
    res.sendFile(path.join(__dirname + '/static/reset.html'));
  });

console.log("starting to server on port " + (process.env.ICEBOX_WEB_PORT || 80));
app.listen(process.env.ICEBOX_WEB_PORT || 80);
