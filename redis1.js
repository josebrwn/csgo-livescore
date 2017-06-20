//Port config
const PORT = 3000;

//Requires and main server objects
var redis = require('redis');
var socketio = require('socket.io');
var app = require('http').createServer().listen(PORT);
var io = socketio.listen(app);

//This object will contain all the channels being listened to.
var global_channels = {};

//Server Logic goes here
io.on('connection', function(socketconnection) {

    //All the channels this connection subscribes to
    socketconnection.connected_channels = {}

    //Subscribe request from client
    socketconnection.on('subscribe', function(channel_name) {
        //Set up Redis Channel
        console.log('subscribe received');
        if (global_channels.hasOwnProperty(channel_name)) {
            //If channel is already present, make this socket connection one of its listeners
            global_channels[channel_name].listeners[socketconnection.id] = socketconnection;
        } else {
            //Else, initialize new Redis Client as a channel and make it subscribe to channel_name
            global_channels[channel_name] = redis.createClient(); // TODO hltv?
            global_channels[channel_name].subscribe(channel_name);
            global_channels[channel_name].listeners = {};
            //Add this connection to the listeners
            global_channels[channel_name].listeners[socketconnection.id] = socketconnection;
            //Tell this new Redis client to send published messages to all of its listeners TODO hltv?
            global_channels[channel_name].on('message', function(channel, message) {
                Object.keys(global_channels[channel_name].listeners).forEach(function(key) {
                    global_channels[channel_name].listeners[key].send(message);
                });
            });
        }

        socketconnection.connected_channels[channel_name] = global_channels[channel_name];

    });

    //Unsubscribe request from client
    socketconnection.on('unsubscribe', function(channel_name) {
        if (socketconnection.connected_channels.hasOwnProperty(channel_name)) {
            //If this connection is indeed subscribing to channel_name
            //Delete this connection from the Redis Channel's listeners
            delete global_channels[channel_name].listeners[socketconnection.id];
            //Delete channel from this connection's connected_channels
            delete socketconnection.connected_channels[channel_name];
        }
    });

    //Disconnect request from client
    socketconnection.on('disconnect', function() {
        //Remove this connection from listeners' lists of all channels it subscribes to
        Object.keys(socketconnection.connected_channels).forEach(function(channel_name) {
            delete global_channels[channel_name].listeners[socketconnection.id];
        });
    });

});

/* client:

var io = require('socket.io-client');
var serverUrl = 'http://localhost:3000';
var conn = io.connect(serverUrl);

conn.emit('subscribe', 'somechannel');
conn.on('message', function (message){
  console.log(message);
  conn.emit('unsubscribe', 'somechannel');
});

*/
