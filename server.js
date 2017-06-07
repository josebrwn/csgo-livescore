var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Livescore = require('./hltv-livescore');
var CircularJSON = require('circular-json');

// create a namespace for livegames:
var lg = io.of('/livegames');

// global variables
var all_rooms = [];
var old_streams = [];

// start the server
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
http.listen(3000, function(){
  console.log('listening on *:3000');
});
// const listid = process.argv[2];
// var live = new Livescore({listid});
// console.log(live);
lg.on('connection', function(socket){
  console.log( 'User ' + socket.id + ' connected' );
  socket.on('disconnect', function(){
    console.log( 'User ' + socket.id + ' disconnected' );
  });
  socket.on('msg_to_server', function(room){
    console.log('message: ' + room);
    lg.emit('msg_to_client', room); // broadcast to all sockets

    // leave current room, if any. NB doesn't seem to work
    for (var id in socket.rooms) {
      console.log('I am connected to room id', id);
      if (id == parseInt(id, 10)) {
        console.log('attempting to leave integer room', id);
        socket.leave(room);
      }
    }
    console.log('I am now in rooms', socket.rooms);
    // assign requesting user to the new room
    // socket.disconnect();
    socket.join(room);
    console.log('and now, I am in rooms', socket.rooms);

    livestream = new Livescore({listid: room});
    // if room does not exist, create new livestream
    if (all_rooms.includes(room) == false) {
      all_rooms.push(room);
    //   livestream = new Livescore({listid: room});
    //   old_streams[room] = livestream;
    }
    // else {
    //   console.log('reusing old stream');
    //   livestream = old_streams[room];
    // }

    console.log('livestream listid is', livestream["listid"]); // neat! this object represents the actual connection
    lg.to(room).emit('msg_to_client', livestream["listid"]);

    livestream.on('raw', function(data) {
      try {
        // console.log(data);
        lg.to(room).emit('msg_to_client', CircularJSON.stringify(data, null, 2));
        lg.to(room).emit('msg_to_client', 'I am in room ' + room);
        lg.to(room).emit('msg_to_client', 'all my rooms ' + CircularJSON.stringify(socket.rooms, null, 2));
        lg.to(room).emit('msg_to_client', 'my socket id ' + socket.id);
      }
      catch (err) {console.log(err);}
    });

  });
});
