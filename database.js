let mssql = require('mssql');
let fs = require('fs');

class Database
{

  static connect(username, password, server, database)
  {
    if (Database.connection !== null) {
      return Database.connection;
    }

    let storedUsername = 'node';
    let storedPassword = 'bessie';
    let storedServer = 'localhost';
    let storedDatabase = 'staging';

    // try {
    //   fs.accessSync(__dirname + '/../../config.js');
    //
    //   let config = require(__dirname + '/../../config')
    //
    //   storedUsername = config.sql.username;
    //   storedPassword = config.sql.password;
    //   storedServer = config.sql.server;
    //   storedDatabase = config.sql.database;
    //
    // } catch (err) {
    //   console.log(err);
    // }

    let configuration = {
      user: username || storedUsername || '',
      password: password || storedPassword || '',
      server: server || storedServer || 'localhost',
      database: database || storedDatabase || '',
    }

    Database.connection = new mssql.Connection(configuration);

    Database.connection.connect();
  }

  static disconnect()
  {
    Database.connection.close();
  }

  static getConnection()
  {
    if (Database.connection === null) {
      try {
        Database.connect();
      } catch (e) {
        throw new Error('Database.getConnection: Database not connected.');
      }
    }

    return Database.connection;
  }

  static getInstance()
  {
    return mssql;
  }

  static query(query, fields)
  {
    if (typeof query !== 'string' || typeof fields !== 'object') {
      throw new Error("Invalid parameters");
    }

    let db = Database.getInstance();
    let connection = Database.getConnection();
    let ps = new db.PreparedStatement(connection);
    let values = {};

    fields.forEach(function(current, index) {
      ps.input(current.name, current.type);
      values[current.name] = current.value;
    });

    connection.on('connect', function(err) {
      if (err) {
        throw err;
      }

      ps.prepare(query, function(err) {
        if (err) {
          throw new Error(err);
        }

        ps.execute(values, function(err, recordset, affected) {
          if (err) {
            ps.unprepare(function(err) {
              if (err) {
                throw new Error(err);
              }
            });
            throw new Error(err);
          }

          ps.unprepare(function(err) {
            if (err) {
              throw new Error(err);
            }
          });
        });
      });
    });
  }
}

Database.connection = null;

module.exports = Database;
