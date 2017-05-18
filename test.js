const sql = require('mssql')

const config = {
  user: 'node',
  password: 'bessie',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: 'staging'
};
var value = 1;

sql.connect(config).then(() => {
    return sql.query`select top 1 * from HLTVMatchEvent where event_id > ${value}`;
}).then(result => {
    console.dir(result);
    return sql.query`select top 2 * from HLTVMatch`;
}).then(result => {
    console.dir(result);
    sql.close();
}).catch(err => {
    console.log('error', err);
    sql.close();
});





sql.on('error', err => {
    // ... error handler
    console.log('error', err);
});
