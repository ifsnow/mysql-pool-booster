module.exports = ShardingPoolCluster;

function ShardingPoolCluster(poolCluster, id) {
  this._poolCluster = poolCluster;
  this._id = id;
  return this;
}

ShardingPoolCluster.prototype.getWriter = function() {
  return this._poolCluster.getWriter(this._id);
};

ShardingPoolCluster.prototype.writer = ShardingPoolCluster.prototype.getWriter;

ShardingPoolCluster.prototype.getReader = function() {
  return this._poolCluster.getReader(this._id);
};

ShardingPoolCluster.prototype.reader = ShardingPoolCluster.prototype.getReader;

ShardingPoolCluster.prototype.getWriterConnection = function(cb) {
  this.getWriter().getConnection(cb);
};

ShardingPoolCluster.prototype.getReaderConnection = function(cb) {
  this.getReader().getConnection(cb);
};

ShardingPoolCluster.prototype.getConnection = function(cb) {
  this._poolCluster.getConnection(this._id, cb);
};
