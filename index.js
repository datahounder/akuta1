
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const configParams = require('./config.json');
// var file = '/dev/cu.usbserial';
// var file = '/dev/ttyUSB0';
//var file = '/dev/tty.usbserial';
const file = 'COM7';

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

app.use(auth);
//app.use(express.static('/dashboard.html'))

const parser = new parsers.Readline({
  delimiter: '\r\n'
});


const port = new SerialPort(file, {
  baudRate: 115200
});

function configstats(){
	//port.write("log usb2 SATVIS ONTIME 60 \r\n", callbackForWrite);
	//port.write("log usb2 BESTPOSA ONTIME 1 \r\n", callbackForWrite);	
	//port.write("log usb2 TRACKSTATA	ONTIME 1 \r\n", callbackForWrite);
  //port.write("log usb2 BESTSATS ONTIME 1 \r\n", callbackForWrite);
  port.write("log gpgga ontime 1 \r\n", callbackForWrite);
  port.write("log gprmc ontime 1 \r\n", callbackForWrite);
  port.write("log gpgsa ontime 1 \r\n", callbackForWrite);
  port.write("log gpgll ontime 1 \r\n", callbackForWrite);
  port.write("log gpgsv ontime 1 \r\n", callbackForWrite);
  port.write("log gpvtg ontime 1 \r\n", callbackForWrite);
  port.write("log gpzda ontime 1 \r\n", callbackForWrite);
  port.write("log gphdt ontime 1 \r\n", callbackForWrite);
  port.write("log gpgst ontime 1 \r\n", callbackForWrite);
}




function callbackForWrite(err){
	if(err){
		console.log("Can not write to serialport");
		return;

	}
	console.log("Successfully write command");
}

configstats();


port.pipe(parser);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/dashboard.html');
});

var GPS = require('gps');
var gps = new GPS;
gps.state.bearing = 0;
var prev = {lat: null, lon: null};

http.listen(3000, function() {

  console.log('listening on *:3000');
 
  gps.on('data', function() {
    ;
    if (prev.lat !== null && prev.lon !== null) {
      gps.state.bearing = GPS.Heading(prev.lat, prev.lon, gps.state.lat, gps.state.lon);
    }
    io.emit('state', gps.state);
    prev.lat = gps.state.lat;
    prev.lon = gps.state.lon;
    ;
  });

  parser.on('data', function(data) {
    gps.update(data);
  });
});

function auth(req,res,next){
  function send401(){
      res.writeHead(401,{'WWW-Authenticate':'Basic'});
      res.end();
  }
  var authHeader = req.headers.authorization;
  if (!authHeader) {
      send401();
      return; 
  }

  var auth = new Buffer(authHeader.split(' ')[1], 'base64').toString().split(':');
  var user = auth[0];
  var pass = auth[1];

  if(user == configParams.login && pass == configParams.password){
      next();
  }else{
      send401();
  }
}
