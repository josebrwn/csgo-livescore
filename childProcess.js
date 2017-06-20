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
var old_data; // socketio-wildcard

// write to log file
// util = require('util');
var CircularJSON = require('circular-json'); // expands objects and handles circular references
// var logging = require('./logging');

// the current UTC date and time. NB: HLTV is on Central European Time (CET or CEDT).
var currentTime = () => {
  _time = new Date().toISOString().
  replace(/T/, ' ').    // replace T with a space
  replace(/\..+/, '');
  return _time;
};

// events

// raw data from socketio-wildcard: use this and comment everything below to simply log raw data.
// live.on('raw', function(data) {
//   if (data != old_data) {
//     console.log(CircularJSON.stringify(data, null, 2));
//     old_data = data;
//   }
// });

// Emitted every time the timer on the scoreboard is updated.
live.on('time', function(data) {
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('time remaining:', minutes + ':' + String('0' + seconds).slice(-2));
  process.send({ message: 'time remaining: ' + minutes + ':' + String('0' + seconds).slice(-2) });

});

// Emitted when clock resets at matchStart, roundEnd, roundStart, bombPlanted (, etc.?)
live.on('clock', function(data) {
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('clock started at:', minutes + ':' + String('0' + seconds).slice(-2));
  process.send({ message: 'clock started at: ' + minutes + ':' + String('0' + seconds).slice(-2) });
});

// debug info - add wherenever needed to clarify events
live.on('debug', function(data) {
  // ** console.log('***', 'debug', data);
});

// Emitted whenever HLTV feels like giving us logs (after kills, round events, etc)
live.on('log', function(data) {
  if (!isLive) { // tone it down
    console.log(CircularJSON.stringify(data, null, 2));
    process.send({ message: CircularJSON.stringify(data, null, 2) });
  }
});


// Emitted when we successfully connect to the HLTV Socket.io server.
live.on('connected', function(data) {
  console.log('connected');
  process.send({ message: 'connected' });
});

// Emitted immediately before the first scoreboard event is emitted.
live.on('started', function(data) {
  console.log('Scorebot has started');
  process.send({ message: 'Scorebot has started' });
});

// Emitted whenever HLTV sends us a scoreboard update. The scoreboard may not be any different from the last update.
live.on('scoreboard', function(data) {
  if (t1id != data.teams[1].id || t1score != data.teams[1].score || t2score != data.teams[2].score || bombplanted != data.bombPlanted || currentround != data.currentRound || map != data.map) {
      t1id = data.teams[1].id;
    t2id = data.teams[2].id;
    t1score = data.teams[1].score;
    t2score = data.teams[2].score;
    bombplanted = data.bombPlanted;
    currentround = data.currentRound;
    map = data.map;
    // scoreboard is emitted both at roundStart and roundEnd
    if (!isLive) { // tone it down
      console.log(CircularJSON.stringify(data, null, 2));
      process.send({ message: CircularJSON.stringify(data, null, 2) });
    }
    console.log('map:', map);
    process.send({ message: map });
    console.log('currentRound:', currentround);
    process.send({ message: 'current round: ' + currentround });
    console.log('bombPlanted:', bombplanted);
    process.send({ message: 'bomb planted: ' + bombplanted });
    console.log('Terrorists:', data.teams[1].name + '(' + data.teams[1].id + ')', ':', t1score);
    process.send({ message: 'Terrorists: ' + data.teams[1].name + '(' + data.teams[1].id + ')' + ': ' + t1score });
    console.log('CounterTerrorists:', data.teams[2].name + '(' + data.teams[2].id + ')', ':', t2score);
    process.send({ message: 'CounterTerrorists:' + data.teams[2].name + '(' + data.teams[2].id + ')' + ': ' + t2score });
    }
});

// Emitted after every kill.
live.on('kill', function(data) {
  console.log(data.killer.name, '<' + data.killer.team.name + '('+ data.killerside +')>', ' killed ', data.victim.name, '<' + data.victim.team.name + '('+ data.victimside +')>', 'with', data.weapon, data.headshot ? '(headshot)' : '');
  process.send({ message: data.killer.name + '<' + data.killer.team.name + '('+ data.killerside +')>' + ' killed ' + data.victim.name + '<' + data.victim.team.name + '('+ data.victimside +')>' + ' with ' + data.weapon + data.headshot ? '(headshot)' : '' });
});

// Emitted after a player commits suicide
live.on('suicide', function(data) {
  console.log('suicide: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
  process.send({ message: 'suicide: ' + data.player.name + '(' + data.player.hltvid + ')' + '<' + data.player.team.name + '(' + data.player.team.id + ')>'  });
});

// Emitted when the bomb is planted
live.on('bombPlanted', function(data) {
  console.log('bomb planted: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
  process.send({ message: 'bomb planted: ' + data.player.name + '(' + data.player.hltvid + ')' + '<' + data.player.team.name + '(' + data.player.team.id + ')>'  });
});

// Emitted when the bomb is defused
live.on('bombDefused', function(data) {
  console.log('bomb defused: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
  process.send({ message: 'bomb defused: ' + data.player.name + '(' + data.player.hltvid + ')' + '<' + data.player.team.name + '(' + data.player.team.id + ')>'  });
});

// Emitted at the start of every match
live.on('matchStart', function(data) {
  console.log('match start');
  process.send({ message: 'match start' });
});

// Emitted at the start of every round.
live.on('roundStart', function(data) {
  console.log('round start');
  process.send({ message: 'round start' });
  isLive = true;
});

// Emitted at the end of every round.
live.on('roundEnd', function(data) {
  console.log('round end');
  process.send({ message: 'round end' });
  isLive = false;
});

// Emitted when the score is restarted
live.on('restart', function(data) {
  console.log('restart. score reset');
  process.send({ message: 'restart. score reset' });
});

// Emitted when the map is changed.
live.on('mapChange', function(data) {
  console.log('map change');
  process.send({ message: 'map change' });
});

// Emitted when the map is changed.
live.on('playerJoin', function(data) {
  console.log('player join', data.player.name + '(' + data.player.hltvid + ')');
  process.send({ message: 'player join' + data.player.name + '(' + data.player.hltvid + ')' });
});

// Emitted when the map is changed.
live.on('playerQuit', function(data) {
  console.log('player quit', data.player.name + '(' + data.player.hltvid + ')');
  process.send({ message: 'player quit' + data.player.name + '(' + data.player.hltvid + ')' });
});
