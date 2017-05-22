var Livescore = require('./hltv-livescore');
const listid = process.argv[2];
var live = new Livescore({
  listid
});
// global scoreboard variables
var t1id;
var t2id;
var t1score;
var t2score;
var bombplanted;
var currentround;
var map;
var isLive = false;
var path = require('path'); // fixes paths in windows & unix
console.log(path.join(__dirname, '..', listid + '.log'));
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });
});
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// write to log file
// util = require('util');
var CircularJSON = require('circular-json'); // expands objects and handles circular references
var logging = require('./logging');

// the current UTC date and time. NB: HLTV is on Central European Time (CET or CEDT).
var currentTime = () => {
  _time = new Date().toISOString().
  replace(/T/, ' ').    // replace T with a space
  replace(/\..+/, '');
  return _time;
};
// events

// Emitted every time the timer on the scoreboard is updated.
live.on('time', function(data) {
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('***', 'time remaining:', minutes + ':' + String("0" + seconds).slice(-2));
  // console.log('***', currentTime());
});

// Emitted when clock resets at matchStart, roundEnd, roundStart, bombPlanted (, etc.?)
live.on('clock', function(data) {
  console.log('***');
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('***', 'CLOCK STARTED AT:', minutes + ':' + String("0" + seconds).slice(-2));
  console.log('***');
});

// debug info - add wherenever needed to clarify events
live.on('debug', function(data) {
  console.log('***');
  console.log('***', 'debug', data);
  console.log('***');
  try {
    io.emit('chat message', data);
  }
  catch (err) {
    console.log(err);
  }
});

// Emitted whenever HLTV feels like giving us logs (after kills, round events, etc)
live.on('log', function(data) {
  console.log('***', 'log');
  // console.dir truncates results, console.log doesn't expand Players
  // console.log(JSON.stringify(data, null, 2));
  console.log(CircularJSON.stringify(data, null, 2));
  // console.log('***', currentTime());
});

// Emitted when we successfully connect to the HLTV Socket.io server.
live.on('connected', function(data) {
  console.log('***', 'connected');
  // console.log('***', currentTime());
});

// Emitted upon connection when a listid is present.
live.on('readyForMatch', function(data) {
  console.log('***', 'readyForMatch');
  console.log(data);
  // console.log('***', currentTime());
});

// Emitted immediately before the first scoreboard event is emitted.
live.on('started', function(data) {
  console.log('***', 'Scorebot has started');
  // console.log('***', currentTime());
});

// Emitted whenever HLTV sends us a scoreboard update. The scoreboard may not be any different from the last update.
live.on('scoreboard', function(data) {
  if (t1id != data.teams[1].id || t1score != data.teams[1].score || t2score != data.teams[2].score || bombplanted != data.bombPlanted || currentround != data.currentRound || map != data.map) {
    console.log('***');
    t1id = data.teams[1].id;
    t2id = data.teams[2].id;
    t1score = data.teams[1].score;
    t2score = data.teams[2].score;
    bombplanted = data.bombPlanted;
    currentround = data.currentRound;
    map = data.map;
    console.log('***', 'scoreboard');
    // scoreboard is emitted both at roundStart and roundEnd
    if (!isLive) {
      console.log(CircularJSON.stringify(data, null, 2));
    }
    else {
      console.dir(data);
    }
    console.log('***', "map:", map);
    console.log('***', "currentRound:", currentround);
    console.log('***', "bombPlanted:", bombplanted);
    console.log('***', "Team 1 id (T):", t1id, "name:", data.teams[1].name, "score:", t1score);
    console.log('***', "Team 2 id (CT):", t2id, "name:", data.teams[2].name, "score:", t2score);
    // console.log('***', currentTime());
    console.log('***');
  }
});

// Emitted after every kill.
live.on('kill', function(data) {
  console.log('***', data.killerside, "team", data.killer.team.name, "player", data.killer.name, 'killed', data.victimside, "team", data.victim.team.name, "player", data.victim.name, 'with', data.weapon, data.headshot ? '(headshot)' : '');
  console.log('***', "killer name", data.killer.name);
  console.log('***', "killer steamid", data.killer.steamid.accountid);
  console.log('***', "killer hltvid", data.killer.hltvid);
  console.log('***', "killer teamname", data.killer.team.name);
  console.log('***', "killer teamid", data.killer.team.id);
  console.log('***', "killer alive", data.killer.alive);
  console.log('***', "killer money", data.killer.money);
  console.log('***', "killer rating", data.killer.rating);
  console.log('***', "killer kills", data.killer.kills);
  console.log('***', "killer assists", data.killer.assists);
  console.log('***', "killer deaths", data.killer.deaths);
  console.log('***', "victim name", data.victim.name);
  console.log('***', "victim steamid", data.victim.steamid.accountid);
  console.log('***', "victim hltvid", data.victim.hltvid);
  console.log('***', "victim teamname", data.victim.team.name);
  console.log('***', "victim teamid", data.victim.team.id);
  console.log('***', "victim alive", data.victim.alive);
  console.log('***', "victim money", data.victim.money);
  console.log('***', "victim rating", data.victim.rating);
  console.log('***', "victim kills", data.victim.kills);
  console.log('***', "victim assists", data.victim.assists);
  console.log('***', "victim deaths", data.victim.deaths);

  // console.log('***', currentTime());
  console.log('***');
});

// Emitted after a player commits suicide
live.on('suicide', function(data) {
  console.log('***', 'suicide');
  console.log('***', 'player', data.player.name);
  console.log('***', 'hltvid', data.player.hltvid);
  console.log('***', 'teamname: ', data.player.team.name);
  console.log('***', 'teamid: ', data.player.team.id);
  console.log('***');
});

// Emitted when the bomb is planted
live.on('bombPlanted', function(data) {
  console.log('***', 'bombPlanted');
  console.log('***', 'player', data.player.name);
  console.log('***', 'hltvid', data.player.hltvid);
  console.log('***', 'teamname: ', data.player.team.name);
  console.log('***', 'teamid: ', data.player.team.id);
  console.log('***');
});

// Emitted when the bomb is defused
live.on('bombDefused', function(data) {
  console.log('***', 'bombDefused');
  console.log('***', 'player', data.player.name);
  console.log('***', 'hltvid', data.player.hltvid);
  console.log('***', 'teamname: ', data.player.team.name);
  console.log('***', 'teamid: ', data.player.team.id);
  console.log('***');
});

// Emitted at the start of every match
live.on('matchStart', function(data) {
  // console.log('***', currentTime());
});

// Emitted at the start of every round.
live.on('roundStart', function(data) {
  console.log('***', 'roundStart');
  isLive = true;
  // console.log('***', currentTime());
});

// Emitted at the end of every round.
live.on('roundEnd', function(data) {
  console.log('***', 'roundEnd');
  isLive = false;
  // console.log('***', currentTime());
});

// Emitted when the score is restarted
live.on('restart', function(data) {
  console.log('***', 'restart - score is restarted');
  // console.log('***', currentTime());
});

// Emitted when the map is changed.
live.on('mapChange', function(data) {
  console.log('***', 'mapChange');
  // console.log('***', currentTime());
});

// Emitted when the map is changed.
live.on('playerJoin', function(data) {
  console.log('***', 'playerJoin');
  // console.log('***', currentTime());
});

// Emitted when the map is changed.
live.on('playerQuit', function(data) {
  console.log('***', 'playerQuit');
  // console.log('***', currentTime());
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
http.listen(3000, function(){
  console.log('listening on *:3000');
});
