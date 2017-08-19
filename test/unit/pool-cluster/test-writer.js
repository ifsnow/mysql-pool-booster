var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster();

cluster.add({
  clusterType : 'writer',
  clusterId   : 'main',
  port        : common.fakeServerPort
});

cluster.add({
  clusterType : 'writer',
  clusterId   : 'sub',
  port        : common.fakeServerPort
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  cluster.getWriter().getConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('WRITER::main', connection._clusterId);
    connection.release();

    cluster.getWriterConnection(function(err, connection) {
      assert.ifError(err);
      assert.equal('WRITER::sub', connection._clusterId);
      connection.release();

      cluster.getWriter('sub').getConnection(function(err, connection) {
        assert.ifError(err);
        assert.equal('WRITER::sub', connection._clusterId);
        connection.release();

        cluster.end(function (err) {
          assert.ifError(err);
          server.destroy();
        });
      });
    });
  });
});
