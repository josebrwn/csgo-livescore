var Livescore = require('./hltv-livescore');
const listid = process.argv[2];
var live = new Livescore({
  listid: listid
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
var self = this; // 'this', the io client
self.time = 0;
self.interval; // time remaining.
var maxInactive = 600;
var tick = 120; // remaining inactive alert

// write to log file
// util = require('util');
var CircularJSON = require('circular-json'); // expands objects and handles circular references

// call this whenever something happens. emit periodically. if inactive, exits.
var setInactivityTimer = function(time) {
  clearInterval(self.interval);
  self.time = time;
  // "Infinite Loop" Execution ~ setInterval().
  self.interval = setInterval(() => {
    var _s;
    self.time = self.time - 1;
    _s = Number(self.time);
    if (_s % tick === 0 && _s > -1) {
      console.log('inactive time remaining ', self.time);
      process.send('inactive time remaining ' + self.time);
    }
    if (_s <= 0) {
      console.log('exiting due to inactivity');
      process.send('exiting due to inactivity');
      throw new Error('exiting'); // child self-destructs
    }
  }, 1000);
};

// events

// raw data from socketio-wildcard: use this and comment everything below to simply log raw data.
// live.on('raw', function(data) {
//   if (data != old_data) {
//     data["listid"] = live.listid;
//
//     console.log(CircularJSON.stringify(data, null, 2));
//     old_data = data;
//     process.send(live.listid);
//   }
// });

// Log events

// Emitted every time the timer on the scoreboard is updated. data = seconds.
live.on('time', function(data) {
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('time remaining:', minutes + ':' + String('0' + seconds).slice(-2));
  process.send('time remaining: ' + minutes + ':' + String('0' + seconds).slice(-2));
});

// Emitted when clock resets at matchStart, roundEnd, roundStart, bombPlanted (, etc.?)
live.on('clock', function(data) {
  var adjusted = data;
  var minutes = Math.floor(adjusted / 60);
  var seconds = adjusted - minutes * 60;
  console.log('clock started at:', minutes + ':' + String('0' + seconds).slice(-2));
  process.send('clock started at: ' + minutes + ':' + String('0' + seconds).slice(-2));
});

// debug info - add wherenever needed to clarify events
live.on('debug', function(data) {
  // ** console.log('***', 'debug', data);
});

// Emitted whenever HLTV feels like giving us logs (after kills, round events, etc)
live.on('log', function(data) {
  // if (!isLive) { // tone it down
    console.log(data);
    process.send(CircularJSON.stringify(data, null, 2) );
    setInactivityTimer(maxInactive);
  // }
});

// Emitted immediately before the first scoreboard event is emitted.
live.on('started', function(data) {
  console.log('Scorebot has started');
  process.send('Scorebot has started');
  setInactivityTimer(maxInactive);
});

// Emitted whenever HLTV sends us a scoreboard update. The scoreboard may not be any different from the last update.
live.on('scoreboard', function(data) {
  if (t1id != data.teams[1].id || t1score != data.teams[1].score || t2score != data.teams[2].score || bombplanted != data.bombPlanted || currentround != data.currentRound || map != data.map) {
    data["listid"] = live.listid;
    t1id = data.teams[1].id;
    t2id = data.teams[2].id;
    t1score = data.teams[1].score;
    t2score = data.teams[2].score;
    bombplanted = data.bombPlanted;
    currentround = data.currentRound;
    map = data.map;
    // scoreboard is emitted both at roundStart and roundEnd
    // if (!isLive) { // tone it down
      console.log(CircularJSON.stringify(data, null, 2));
      process.send(CircularJSON.stringify(data, null, 2));
    // }
    // console.log('map:', map);
    // process.send(map });
    // console.log('currentRound: ', currentround);
    // process.send('current round: ' + currentround);
    // console.log('bombPlanted: ', bombplanted);
    // process.send('bomb planted: ' + bombplanted);
    // console.log('Terrorists: ', data.teams[1].name + ' (' + data.teams[1].id + ')', ':', t1score);
    // process.send('Terrorists: ' + data.teams[1].name + ' (' + data.teams[1].id + ')' + ': ' + t1score);
    // console.log('CounterTerrorists: ', data.teams[2].name + '(' + data.teams[2].id + ')', ':', t2score);
    // process.send('CounterTerrorists: ' + data.teams[2].name + ' (' + data.teams[2].id + ')' + ': ' + t2score);
    }
    setInactivityTimer(maxInactive);
});

// Match events

// Emitted at the start of every match
live.on('matchStart', function(data) {
  isLive = true;
  console.log('match start');
  process.send('match start');
  setInactivityTimer(maxInactive);
});

// Emitted at the start of every round.
live.on('roundStart', function(data) {
  isLive = true;
  console.log('round start');
  process.send('round start');
  setInactivityTimer(maxInactive);
});

// Emitted at the end of every round.
live.on('roundEnd', function(data) {
  isLive = false;
  console.log('round end');
  process.send('round end');
});

// Emitted when the score is restarted
live.on('restart', function(data) {
  console.log('restart. score reset');
  process.send('restart. score reset');
  setInactivityTimer(maxInactive);
});

// Emitted when the map is changed.
live.on('mapChange', function(data) {
  console.log('map change');
  process.send('map change');
});

// Player events

// Emitted after every kill.
live.on('kill', function(data) {
  // if (isLive) {
  console.log(data.killer.name, '<' + data.killer.team.name + '('+ data.killerside +')>', ' killed ', data.victim.name, '<' + data.victim.team.name + '('+ data.victimside +')>', 'with', data.weapon, data.headshot ? '(headshot)' : '');
  process.send(data.killer.name + ' <' + data.killer.team.name + ' ('+ data.killerside +')>' + ' killed ' + data.victim.name + ' <' + data.victim.team.name + ' ('+ data.victimside +')> ' + 'with: ' + data.weapon + ", headshot: " + data.headshot);
  // }
});

// Emitted after a player commits suicide
live.on('suicide', function(data) {
  if (data.player != undefined) {
    console.log('suicide: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
    process.send('suicide: ' + data.player.name + ' (' + data.player.hltvid + ') ' + '<' + data.player.team.name + ' (' + data.player.team.id + ')>' );
  }
});

// Emitted when the bomb is planted
live.on('bombPlanted', function(data) {
  if (data.player != undefined) {
    console.log('bomb planted: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
    process.send('bomb planted: ' + data.player.name + ' (' + data.player.hltvid + ') ' + '<' + data.player.team.name + ' (' + data.player.team.id + ')>');
  }
});

// Emitted when the bomb is defused
live.on('bombDefused', function(data) {
  if (data.player != undefined) {
    console.log('bomb defused: ', data.player.name + '(' + data.player.hltvid + ')', '<', data.player.team.name + '(' + data.player.team.id + ')>' );
    process.send('bomb defused: ' + data.player.name + ' (' + data.player.hltvid + ') ' + '<' + data.player.team.name + ' (' + data.player.team.id + ')>');
  }
});

// Emitted when the map is changed.
live.on('playerJoin', function(data) {
  if (data.player != undefined) {
    console.log('player join ', data.player.name + ' (' + data.player.hltvid + ')');
    process.send('player join ' + data.player.name + ' (' + data.player.hltvid + ')');
  }
});

// Emitted when the map is changed.
live.on('playerQuit', function(data) {
  if (data.player != undefined) {
    console.log('player quit ', data.player.name + ' (' + data.player.hltvid + ')');
    process.send('player quit ' + data.player.name + ' (' + data.player.hltvid + ')');
  }
});
