module.exports = require('./lib/index.js');

module.exports.Classes = {
    Player: require('./lib/classes/Player.js'),
    Team: require('./lib/classes/Team.js'),
    Round: require('./lib/classes/Round.js'),
    Scoreboard: require('./lib/classes/Scoreboard.js')
};

module.exports.Enums = {
    EOption: require('./resources/EOption.js'),
    ERoundType: require('./resources/ERoundType.js'),
    ESide: require('./resources/ESide.js')
};
