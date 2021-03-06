var assert = require('assert');
var common = require('../../common');

var pool = common.createPool({
  connectionLimit : 2,
  port            : common.fakeServerPort,
  maxIdle         : 0
});

var server = common.createFakeServer();

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  pool.getConnection(function (err, connection) {
    assert.ifError(err);

    setTimeout(function() {
      connection.release();
    }, 1000);
  });

  pool.getConnection(function (err, connection) {
    assert.ifError(err);

    setTimeout(function() {
      connection.release();
    }, 1000);
  });

  setTimeout(function() {
    assert.deepEqual(pool.getStatus(), {
      all   : 2,
      use   : 2,
      idle  : 0,
      queue : 0
    });
  }, 500);

  setTimeout(function() {
    assert.deepEqual(pool.getStatus(), {
      all   : 2,
      use   : 0,
      idle  : 2,
      queue : 0
    });

    server.destroy();
  }, 1500);
});
