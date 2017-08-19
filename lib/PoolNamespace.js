var PoolSelector = require('./PoolSelector');

module.exports = PoolNamespace;

/**
 * PoolNamespace
 * @constructor
 * @param {PoolCluster} cluster The parent cluster for the namespace
 * @param {string} pattern The selection pattern to use
 * @param {string} selector The selector name to use
 * @public
 */
function PoolNamespace(cluster, pattern, selector) {
  this._cluster = cluster;
  this._pattern = pattern;
  this._selector = new PoolSelector[selector]();
}

PoolNamespace.prototype.getConnection = function(cb) {
  var clusterNode = this._getClusterNode();
  var cluster = this._cluster;
  var namespace = this;

  if (clusterNode === null) {
    var err = null;

    if (this._cluster._hasOfflineNodes()) {
      err = new Error('Pool does not have online node.');
      err.code = 'POOL_NONEONLINE';
    } else {
      err = new Error('Pool does not exist.');
      err.code = 'POOL_NOEXIST';
    }

    cb(err);
    return;
  }

  cluster._getNodeConnection(clusterNode, function(err, connection) {
    if (err && cluster._canRetry) {
      namespace.getConnection(cb);
      return;
    }

    if (err) {
      cb(err);
      return;
    }

    cb(null, connection);
  });
};

PoolNamespace.prototype.query = function (sql, values, cb) {
  var cluster     = this._cluster;
  var clusterNode = this._getClusterNode();
  var query       = this._cluster._mysql.createQuery(sql, values, cb);
  var namespace   = this;

  if (clusterNode === null) {
    var err = null;

    if (this._cluster._hasOfflineNodes()) {
      err = new Error('Pool does not have online node.');
      err.code = 'POOL_NONEONLINE';
    } else {
      err = new Error('Pool does not exist.');
      err.code = 'POOL_NOEXIST';
    }

    process.nextTick(function () {
      query.on('error', function () {});
      query.end(err);
    });

    return query;
  }

  if (!(typeof sql === 'object' && 'typeCast' in sql)) {
    query.typeCast = clusterNode.pool.config.connectionConfig.typeCast;
  }

  if (clusterNode.pool.config.connectionConfig.trace) {
    // Long stack trace support
    query._callSite = new Error();
  }

  cluster._getNodeConnection(clusterNode, function (err, conn) {
    if (err && cluster._canRetry) {
      namespace.query(query);
      return;
    }

    if (err) {
      query.on('error', function () {});
      query.end(err);
      return;
    }

    // Release connection based off event
    query.once('end', function() {
      conn.release();
    });

    conn.query(query);
  });

  return query;
};

PoolNamespace.prototype._getClusterNode = function _getClusterNode() {
  var foundNodeIds = this._cluster._findNodeIds(this._pattern);
  var foundNodeSize = foundNodeIds.length;

  if (foundNodeSize === 0) {
    return null;
  }

  var nodeId = foundNodeSize === 1 ? foundNodeIds[0] : this._selector(foundNodeIds);
  return this._cluster._getNode(nodeId);
};
