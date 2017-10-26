var io = require('socket.io-client');
var patch = require('socketio-wildcard')(io.Manager);
var EE = require('events').EventEmitter;
var inherits = require('util').inherits;
var CONNECTION = 'http://scorebot2.hltv.org';
var PORT = 10022;
// var CONNECTION = 'https://scorebot-secure.hltv.org';
// var PORT = 443;  // 53132 // , {secure: true}
var self;

function Livescore(options) {
  self = this;
  self.connected = false;
  options = options || {};
  self.gamesList = options.gamesList || self.gamesList || null;
  self.url = options.url || CONNECTION;
  self.port = options.port || PORT;
  self.socket = io(self.url + ':' + self.port);
  // piggyback using the event-emitter bundled with socket.io client
  patch(self.socket);
  self.options = {};
  // there are 3 original events: connect, scoreboard, and log.
  // the rest we create and invoke while parsing the log
  self.socket.on('connect', self._onConnect);
};
inherits(Livescore, EE);

// invoked by hltv connect event
Livescore.prototype._onConnect = function() {
  if (!self.connected) {
    self.connected = true;
    // these are the only other hltv events
    // self.socket.on('log', self._onLog);
    self.socket.on('*', self._onReceive); // captures everything
  }

  /*
  readyForMatch expects a single string - '2310804';
  readyForScores expects an integer array - [2310804,13235,2346246,24564564];
  */

  if (self.gamesList) {
    self.socket.emit('readyForScores', self.gamesList);
    // self.emit('raw', self.gamesList); // can't do this because it'll trigger rogue api calls
  }
};

// invoked by hltv connect event
Livescore.prototype._onReceive = function(data) {
  self.time = currentTime();
  data["timestamp"] = self.time;
  try {self.emit('raw', data);} // 2017-07-20 handle error when parent is unreachable
  catch (e) {console.log(e);}

};

// the current UTC date and time. NB: HLTV is on Central European Time (CET or CEDT).
var currentTime = () => {
  _time = new Date().toISOString().
  replace(/T/, ' ').    // replace T with a space
  replace(/\..+/, '');
  return _time;
};

// TODO _onScore?
module.exports = Livescore;
