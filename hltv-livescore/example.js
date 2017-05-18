var Livescore = require('./');
var live = new Livescore({
    listid: 2307256
});

live.on('kill', function(data) {
    console.log(data.killer.name, 'killed', data.victim.name, 'with', data.weapon, data.headshot ? '(headshot)' : '');
});
