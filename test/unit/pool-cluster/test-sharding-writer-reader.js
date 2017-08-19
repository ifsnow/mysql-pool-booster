var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster();

cluster.add({
  clusterType : 'writer',
  clusterId   : 'new',
  port        : common.fakeServerPort
});

cluster.add({
  clusterType : 'reader',
  clusterId   : 'new',
  port        : common.fakeServerPort
});

cluster.addSharding('by_user_number', function(num) {
  return num > 100 ? 'new' : 'old';
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  var sharding = cluster.getSharding('by_user_number', 200);

  sharding.getReader().getConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('READER::new', connection._clusterId);
    connection.release();

    sharding.getWriter().getConnection(function(err, connection) {
      assert.ifError(err);
      assert.equal('WRITER::new', connection._clusterId);
      connection.release();

      cluster.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});
