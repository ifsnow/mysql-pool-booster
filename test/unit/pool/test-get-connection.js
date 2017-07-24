var common     = require('../../common');
var assert     = require('assert');
var PoolConnection = common.PoolConnection;
var Connection = common.Connection;
var pool       = common.createPool({port: common.fakeServerPort});

var server = common.createFakeServer();

server.listen(common.fakeServerPort, function (err) {
  assert.ifError(err);

  pool.getConnection(function (err, connection) {
    assert.ifError(err);
    assert.ok(connection instanceof PoolConnection);
    assert.equal(connection.getRawConnection().constructor.name, 'Connection');

    connection.destroy();
    server.destroy();
  });
});
