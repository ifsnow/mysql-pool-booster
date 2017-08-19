var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster({
  nodes: [{
    clusterId : 'new',
    port      : common.fakeServerPort
  }, {
    clusterId : 'old',
    port      : common.fakeServerPort
  }],
  shardings: {
    'by_user_number': function (number) {
      return number > 100 ? 'new' : 'old';
    }
  }
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  var shardingOld = cluster.getSharding('by_user_number', 50);
  var shardingNew = cluster.getSharding('by_user_number', [150]);

  shardingOld.getConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('old', connection._clusterId);
    connection.release();

    shardingNew.getConnection(function(err, connection) {
      assert.ifError(err);
      assert.equal('new', connection._clusterId);
      connection.release();

      cluster.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});
