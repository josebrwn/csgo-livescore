'use strict';
// server0000.js. this iteration removes the factory pattern and disconnects old streams. now works properly for ONE user.

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); // use io.close() to disconnect all users dynamically
var Livescore = require('./hltv-livescore');
var CircularJSON = require('circular-json');
// create a namespace for livegames:
var lg = io.of('/livegames');

// global variables
var all_rooms = [];
var old_data; // socketio-wildcard
var livestream;

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
    // socket.room = room; // TODO recheck this: does it fix the problem of a room mixing up data['listid']? i.e. labelling 2311427 onto another stream?
    socket.join(room);
    lg.in(room).emit('msg_to_client', socket.id + ' has joined room ' + room);
    if ([all_rooms].includes(room) == false) {
      all_rooms.push(room);
    }
    if (livestream != undefined) {
      livestream.disconnect(); // TODO does this disconnect all users in the current room, or only the current user?
    }
    livestream = new Livescore({listid: room});
    console.log('msg_to_client', 'the new user is in rooms: ', CircularJSON.stringify(socket.rooms, null, 2));
  });
});

// TODO address major issue: fundamental misconception re. the Livescore object - it cannot exist in the context of a room or socket!

// Prototype implementation:
Livescore.prototype.on('raw', function(data) {
  if (data != old_data) {
    try {
      console.log(data);
      var dataStr = CircularJSON.stringify(data, null, 2);
      dataStr = dataStr.replace(/\\"/g,'\"');
      dataStr = dataStr.replace(/,/g, ',\r\n');

      lg.in(data["listid"]).emit('msg_to_client', dataStr);
      lg.in(data["listid"]).emit('msg_to_client', data["listid"]);
      old_data = data;
    }
    catch (err) {console.log(err);}
  }
});
