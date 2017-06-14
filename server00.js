// server0.js. this iteration tries to add a factory pattern.
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Livescore = require('./hltv-livescore');
var CircularJSON = require('circular-json');
// create a namespace for livegames:
var lg = io.of('/livegames');
// global variables
var all_rooms = [];
// Factory refactored implementation:
var Stream = {
  Live (room) {
    return new Livescore({listid: room});
  }
};
function factoryStream () {
  var stream = Object.create(Stream);
  return stream;
}
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
    // leave current room, if any.
    if(socket.room && socket.room !== room)
        socket.leave(socket.room);
    socket.room = room;
    socket.join(room);
    lg.in(room).emit('msg_to_client', 'A new user has joined room ' + room);
    // factory
    const ls = factoryStream();
    var livestream = ls.Live(room);
    livestream.on('raw', function(data) {
      try {
        lg.in(room).emit('msg_to_client', CircularJSON.stringify(data, null, 2));
      }
      catch (err) {console.log(err);}
    }); // livestream
  }); // socket
}); // connection

// now, it's easy to send a message to just the clients in a given room
room = "abc123";
lg.in(room).emit('message', 'what is going on, party people?');
