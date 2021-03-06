const sql = require('mssql');

const config = {
  "user": '',
  "password": '',
  "server": '', // You can use 'localhost\\instance' to connect to named instance
  "database": 'staging',
  "options": {
    "encrypt": true
  }};
var value = 1000;

sql.connect(config, err => {
  new sql.Request().query(`select count(*) as total1 from HLTVMatchEvent where event_id > ${value}`, (err, result) => {
      // ... error checks

      console.log(result.recordset);
  });
  new sql.Request().query(`select count(*) as total2 from HLTVMatchEvent where event_id < ${value}`, (err, result) => {
      // ... error checks
      console.log(result.recordset);
      sql.close();
  });
  // Stored Procedure
  // new sql.Request()
  // .input('input_parameter', sql.Int, value)
  // .output('output_parameter', sql.VarChar(50))
  // .execute('procedure_name', (err, result) => {
  //     // ... error checks
  //
  //     console.dir(result)
  // })
});

sql.on('error', err => {
    // ... error handler
    console.log('error', err);
    sql.close();
});
