const sql = require('mssql')

const config = {
  user: 'node',
  password: 'bessie',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: 'staging'
};
var value = 1000;

sql.connect(config, err => {
  new sql.Request().query(`select count(*) as total1 from HLTVMatchEvent where event_id > ${value}`, (err, result) => {
      // ... error checks

      console.dir(result)
  })
  new sql.Request().query(`select count(*) as total2 from HLTVMatchEvent where event_id < ${value}`, (err, result) => {
      // ... error checks
      console.dir(result)
  })
  // Stored Procedure
  // new sql.Request()
  // .input('input_parameter', sql.Int, value)
  // .output('output_parameter', sql.VarChar(50))
  // .execute('procedure_name', (err, result) => {
  //     // ... error checks
  //
  //     console.dir(result)
  // })
})

sql.on('error', err => {
    // ... error handler
    console.log('error', err);
});
