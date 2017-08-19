var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster({
  nodes: [{
    clusterType : 'writer',
    clusterId   : 'main',
    port        : common.fakeServerPort
  }, {
    clusterType : 'reader',
    clusterId   : 'sub',
    port        : common.fakeServerPort
  }]
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  cluster.getWriterConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('WRITER::main', connection._clusterId);
    connection.release();

    cluster.getReaderConnection(function(err, connection) {
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
