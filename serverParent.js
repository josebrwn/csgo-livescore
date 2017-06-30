'use strict';
// server1.js attempt to fork child process
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); // use io.close() to disconnect all users dynamically

// var Livescore = require('./hltv-livescore');
var cp = require('child_process');
var CircularJSON = require('circular-json');

// create a namespace for livegames:
var lg = io.of('/livegames');

// globals
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
    console.log( 'User ' + socket.id + ' disconnected');
  });
  socket.on('msg_to_server', function(room){
    console.log('message: ' + room);
    lg.emit('msg_to_client', 'a user has entered room: ' + room); // broadcast to all sockets
    // leave current room, if any.
    if(socket.room && socket.room !== room) {
      socket.leave(socket.room);
    }
    // create the room if it does not exist - a room ceases to exist when child self-terminates
    if (all_rooms.indexOf(room) == -1) {

      // fork the child process
      var child = cp.fork('./childProcess.js', [room]);
      all_rooms.push(room);
      console.log('forking new process');
      console.log(all_rooms);

      // The only events you can receive from the child process are error, exit, disconnect, close, and message.
      child.on('exit', function(data) {
          var index = all_rooms.indexOf(room);
          all_rooms.splice(index, 1); // 'close' the room
      });
      // emit any message received by a child process
      child.on('message', function(data) {
        try {
          var dataStr = CircularJSON.stringify(data, null, 2);
          dataStr = dataStr.replace(/\\"/g,'\"');
          dataStr = dataStr.replace(/\\n/g, '');
          lg.in(room).emit('msg_to_client', dataStr); // console logging is left to child (for dev reasons)
        }
        catch (err) {console.log(err);}
      });
    }
    socket.join(room);
    lg.in(room).emit('msg_to_client', socket.id + ' has joined room ' + room);
  });
});
