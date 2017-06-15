'use strict';
// server0.js. this iteration tries to use a prototype to emit messages. NB added raw data["listid"] here. added string fix to dataStr here.
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Livescore = require('./hltv-livescore');
var CircularJSON = require('circular-json');
// create a namespace for livegames:
var lg = io.of('/livegames');
// Factory pattern:
var Stream = {
  Live (room) {
    return new Livescore({listid: room});
  }
};
function factoryStream () {
  var stream = Object.create(Stream);
  return stream;
}

var old_data; // socketio-wildcard
// start the server
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
http.listen(3000, function(){
  console.log('listening on *:3000');
});
lg.on('connection', function(socket){
  console.log( 'User ' + socket.id + ' connected' );
  socket.on('disconnect', function(){
    console.log( 'User ' + socket.id + ' disconnected' );
  });
  socket.on('msg_to_server', function(room){
    console.log('message: ' + room);
    lg.emit('msg_to_client', 'a user has entered room: ' + room); // broadcast to all sockets
    // leave current room, if any.
    if(socket.room && socket.room !== room)
        socket.leave(socket.room);
    socket.room = room; // TODO check this
    socket.join(room);
    lg.in(room).emit('msg_to_client', 'A new user has joined room ' + room);
    // factory
    const ls = factoryStream();
    var livestream = ls.Live(room); // BUG
  });
});

// Prototype implementation:
Livescore.prototype.on('raw', function(data) {
  if (data != old_data) {
    try {
      console.log(data);
      var dataStr = CircularJSON.stringify(data, null, 2);
      dataStr = dataStr.replace(/\\"/g,'\"');
      dataStr = dataStr.replace(/,/g, ',\r\n');

      lg.in(data["listid"]).emit('msg_to_client', dataStr);
      old_data = data;
    }
    catch (err) {console.log(err);}
  }
});
