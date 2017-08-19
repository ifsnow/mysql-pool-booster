var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster();

cluster.add({
  clusterType : 'reader',
  clusterId   : 'main',
  port        : common.fakeServerPort
});

cluster.add({
  clusterType : 'reader',
  clusterId   : 'sub',
  port        : common.fakeServerPort
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  cluster.getReader().getConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('READER::main', connection._clusterId);
    connection.release();

    cluster.getReaderConnection(function(err, connection) {
      assert.ifError(err);
      assert.equal('READER::sub', connection._clusterId);
      connection.release();

      cluster.getReader('sub').getConnection(function(err, connection) {
        assert.ifError(err);
        assert.equal('READER::sub', connection._clusterId);
        connection.release();

        cluster.end(function (err) {
          assert.ifError(err);
          server.destroy();
        });
      });
    });
  });
});
