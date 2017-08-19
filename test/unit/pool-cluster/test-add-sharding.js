var assert  = require('assert');
var common  = require('../../common');
var server  = common.createFakeServer();
var cluster = common.createPoolCluster();

cluster.add({
  clusterId : 'new',
  port      : common.fakeServerPort
});

cluster.add({
  clusterId : 'old',
  port      : common.fakeServerPort
});

cluster.addSharding('by_user_number', function(num) {
  return num > 100 ? 'new' : 'old';
});

cluster.addSharding('by_two_params', function(a, b) {
  return a + b > 10 ? 'new' : 'old';
});

server.listen(common.fakeServerPort, function(err) {
  assert.ifError(err);

  var shardingNew = cluster.getSharding('by_user_number', 200);
  var shardingOld = cluster.getSharding('by_two_params', [1, 2]);
  var shardingOld2 = cluster.getSharding('by_two_params', [5, 3]);

  assert.deepEqual(shardingOld, shardingOld2);

  shardingNew.getConnection(function(err, connection) {
    assert.ifError(err);
    assert.equal('new', connection._clusterId);
    connection.release();

    shardingOld.getConnection(function(err, connection) {
      assert.ifError(err);
      assert.equal('old', connection._clusterId);
      connection.release();

      cluster.end(function (err) {
        assert.ifError(err);
        server.destroy();
      });
    });
  });
});
