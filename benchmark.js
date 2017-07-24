var mysql = require('mysql');
var MysqlPoolBooster = require('./index.js');
var async = require('async');

var mode = process.argv[2] || 'booster';

if (mode === 'booster') {
  mysql = MysqlPoolBooster(mysql);
}

var poolConfig = {
  host            : process.env.MYSQL_HOST,
  user            : process.env.MYSQL_USER,
  password        : process.env.MYSQL_PASSWORD,
  connectionLimit : 50
};

var pool = mysql.createPool(poolConfig);

TOTAL_EXECUTIONS = 30000;
CONCURRENCY = 25;

// Creates dummy jobs
var jobs = [];

for (var i = 1; i <= TOTAL_EXECUTIONS; i++) {
  jobs.push(i);
}

// Start benchmark
var startTime = process.hrtime();

async.eachLimit(jobs, CONCURRENCY, function (job, callback) {
  pool.getConnection(function(err, connection) {
    connection.query('SELECT 1', function(err) {
      connection.release();
      callback(err);
    });
  });
}, function() {
  pool.end(function() {
    var diff = process.hrtime(startTime);

    var executionTime = diff[0] + diff[1] / 1e9;
    console.log('- Execution time : ' + executionTime + ' seconds');

    var executionsPerSecond = parseInt(TOTAL_EXECUTIONS / executionTime, 10);
    console.log('- Executions per second : ' + executionsPerSecond);
  });
});
