'use strict';

var util = require('util'),
  winston = require('winston'),
  path = require("path"),
  logger = new winston.Logger(),
  production = (process.env.NODE_ENV || '').toLowerCase() === 'production',
  listid = process.argv[2];

module.exports = {
  middleware: function(req, res, next){
    console.info(req.method, req.url, res.statusCode);
    next();
  },
  production: production
};

// Override the built-in console methods with winston hooks
switch((process.env.NODE_ENV || '').toLowerCase()){

  case 'production':
    production = true;
    logger.add(winston.transports.File, {
      filename: path.join(__dirname, '../logs/', listid + '.log'), // '../logs/' + listid + '.log',
      handleExceptions: true,
      exitOnError: false,
      level: 'info'
    });
    break;
  case 'test':
    // Don't set up the logger overrides
    return;
  default:
    logger.add(winston.transports.Console, {
      colorize: true,
      timestamp: true,
      level: 'info'
    });

    logger.add(winston.transports.File, {
      filename: path.join(__dirname, '../logs/', listid + '.log'), // '../logs/' + listid + '.log',
      handleExceptions: true,
      exitOnError: false,
      level: 'info'
    });

    break;
}

function formatArgs(args){
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}

console.dir = function(){
  logger.info.apply(logger, formatArgs(arguments));
};
console.log = function(){
  logger.info.apply(logger, formatArgs(arguments));
};
console.info = function(){
  logger.info.apply(logger, formatArgs(arguments));
};
console.warn = function(){
  logger.warn.apply(logger, formatArgs(arguments));
};
console.error = function(){
  logger.error.apply(logger, formatArgs(arguments));
};
console.debug = function(){
  logger.debug.apply(logger, formatArgs(arguments));
};
