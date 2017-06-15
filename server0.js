// server0.js. this iteration is soley concerned with getting chat to work properly. no hltv connection.

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Livescore = require('./hltv-livescore');
var CircularJSON = require('circular-json');

// create a namespace for livegames:
var lg = io.of('/livegames');

// global variables
var all_rooms = [];

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
    // create a record of the rooms this client is now in
    if (all_rooms.includes(room) == false) {
      all_rooms.push(room);
    }
    // leave current room, if any. NB socket.rooms doesn't change w/in a single event scope.
    for (var id in socket.rooms) {
      if (id == parseInt(id, 10) && id > 0 && id != parseInt(room, 10)) {
        console.log('attempting to leave room ', id);
        socket.leave(id.toString());
      }
    }
    // join the requested room
    socket.join(room);
    lg.in(room).emit('msg_to_client', 'I am now in room ' + room);
  });
});
