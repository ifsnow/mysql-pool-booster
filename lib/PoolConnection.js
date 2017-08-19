var Events = require('events');
var Util   = require('util');

module.exports = PoolConnection;

var _connectionId = 1;

Util.inherits(PoolConnection, Events.EventEmitter);
function PoolConnection(pool, options) {
  Events.EventEmitter.call(this);

  this._connection = pool.getMysql().createConnection(options.config);
  this.config = this._connection.config;
  this.state = 'disconnected';
  this.threadId = null;

  this._id = _connectionId++;
  this._pool = pool;
  this._used = true;
  this._removed = false;
  this._reuseCount = 0;
  this._lastUsedTime = Date.now();

  // Bind connection to pool domain
  if (Events.usingDomains) {
    this.domain = pool.domain;
    this._connection.domain = pool.domain;
  }

  // When a fatal error occurs the connection's protocol ends, which will cause
  // the connection to end as well, thus we only need to watch for the end event
  // and we will be notified of disconnects.
  var self = this;

  this._connection.on('end', function() {
    self.state = 'disconnected';
    self._removeFromPool();
  });

  this._connection.on('error', function (err) {
    self.state = 'protocol_error';
    if (err.fatal) {
      self._removeFromPool();
    } else {
      self.emit('error', err);
    }
  });

  this._connection.on('connect', function() {
    self.state = 'connected';
  });

  this._connection.on('drain', function() {
    self.emit('drain');
  });

  this._connection.on('enqueue', function(sequence) {
    self.emit('enqueue', sequence);
  });
}

PoolConnection.prototype.connect = function (options, callback) {
  this._connection.connect(options, callback);

  var self = this;
  this._connection._protocol.on('handshake', function() {
    self.state = 'authenticated';
    self.threadId = self._connection.threadId;
  });
};

PoolConnection.prototype.query = function (sql, values, cb) {
  return this._connection.query(sql, values, cb);
};

PoolConnection.prototype.changeUser = function (options, callback) {
  return this._connection.changeUser(options, callback);
};

PoolConnection.prototype.beginTransaction = function (options, callback) {
  return this._connection.beginTransaction(options, callback);
};

PoolConnection.prototype.commit = function (options, callback) {
  return this._connection.commit(options, callback);
};

PoolConnection.prototype.rollback = function (options, callback) {
  return this._connection.rollback(options, callback);
};

PoolConnection.prototype.ping = function (options, callback) {
  this._connection.ping(options, callback);
};

PoolConnection.prototype.statistics = function (options, callback) {
  this._connection.statistics(options, callback);
};

PoolConnection.prototype.pause = function() {
  this._connection.pause();
};

PoolConnection.prototype.resume = function() {
  this._connection.resume();
};

PoolConnection.prototype.escape = function(value) {
  return this._connection.escape(value);
};

PoolConnection.prototype.escapeId = function escapeId(value) {
  return this._connection.escapeId(value);
};

PoolConnection.prototype.format = function(sql, values) {
  return this._connection.format(sql, values);
};

PoolConnection.prototype.release = function () {
  if (this.hasPool()) {
    this._pool.releaseConnection(this);
  }
};

// TODO: Remove this when we are removing PoolConnection#end
PoolConnection.prototype._realEnd = function(callback) {
  this._connection.end(callback);
};

PoolConnection.prototype.end = function () {
  console.warn( 'Calling conn.end() to release a pooled connection is ' +
                'deprecated. In next version calling conn.end() will be ' +
                'restored to default conn.end() behavior. Use ' +
                'conn.release() instead.'
              );
  this.release();
};

PoolConnection.prototype.destroy = function () {
  this.state = 'disconnected';
  this._connection.destroy();
  this._removeFromPool();
};

PoolConnection.prototype.getId = function() {
  return this._id;
};

PoolConnection.prototype.updateLastUsedTime = function() {
  this._lastUsedTime = Date.now();
};

PoolConnection.prototype.getLastUsedTime = function() {
  return this._lastUsedTime;
};

PoolConnection.prototype.setUsed = function(used) {
  this._used = used;
};

PoolConnection.prototype.isUsed = function() {
  return this._used;
};

PoolConnection.prototype.setRemoved = function(removed) {
  this._removed = removed;
};

PoolConnection.prototype.isRemoved = function() {
  return this._removed;
};

PoolConnection.prototype.increaseReuseCount = function() {
  this._reuseCount++;
};

PoolConnection.prototype.getReuseCount = function() {
  return this._reuseCount;
};

PoolConnection.prototype.hasPool = function() {
  return this._pool !== null;
};

PoolConnection.prototype.isSamePool = function(pool) {
  return this._pool === pool;
};

PoolConnection.prototype.detachPool = function() {
  this._pool = null;
};

PoolConnection.prototype.getRawConnection = function() {
  return this._connection;
};

PoolConnection.prototype._removeFromPool = function () {
  if (this.hasPool()) {
    this._pool._purgeConnection(this);
  }
};
