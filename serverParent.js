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
    console.log( 'User ' + socket.id + ' disconnected' );
  });
  socket.on('msg_to_server', function(room){
    console.log('message: ' + room);
    lg.emit('msg_to_client', 'a user has entered room: ' + room); // broadcast to all sockets
    // leave current room, if any.
    if(socket.room && socket.room !== room) {
      socket.leave(socket.room);
    }
    // only create the room if it does not exist
    if (all_rooms.indexOf(room) == -1) {
      var child = cp.fork('./childProcess.js', [room]);
      child.on('message', function(data) {

      // data["listid"] = self.listid; // TODO may have to try and harden the listid into the child this way, but it's a longshot if this doesn't work ...

      // The only events you can receive from the child process are error, exit, disconnect, close, and message.
        try {
          var dataStr = CircularJSON.stringify(data, null, 2);
          dataStr = dataStr.replace(/\\"/g,'\"');
          dataStr = dataStr.replace(/,/g, ',\r\n');
          dataStr = dataStr.replace(/\\n/g, '\r\n');
          lg.in(room).emit('msg_to_client', dataStr);
        }
        catch (err) {console.log(err);}
      });
      all_rooms.push(room);
      console.log('forking new process');
      console.log(all_rooms);
    }
    socket.join(room);
    lg.in(room).emit('msg_to_client', socket.id + ' has joined room ' + room);
  });
});
