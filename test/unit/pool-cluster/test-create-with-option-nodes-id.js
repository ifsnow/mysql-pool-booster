var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster({
  nodes: [{
    clusterId : 'MASTER',
    port      : common.fakeServerPort
  }, {
    clusterId : 'SLAVE',
    port      : common.fakeServerPort
  }]
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  cluster.getConnection('MASTER', function(err, connection) {
    assert.ifError(err);
    assert.equal('MASTER', connection._clusterId);
    connection.release();

    cluster.getConnection('SLAVE', function(err, connection) {
      assert.ifError(err);
      assert.equal('SLAVE', connection._clusterId);
      connection.release();

      cluster.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});
