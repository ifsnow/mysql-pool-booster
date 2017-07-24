var urlParse        = require('url').parse;

module.exports = PoolConfig;

function PoolConfig(mysql, options) {
  if (typeof options === 'string') {
    options = this._parseUrl(options);
  }

  var dummyConnection = mysql.createConnection(options);
  this.connectionConfig = dummyConnection.config;

  this.acquireTimeout = this._getPropertyNumber(options.acquireTimeout, 10000);
  this.waitForConnections = this._getPropertyBoolean(options.waitForConnections, true);
  this.connectionLimit = this._getPropertyNumber(options.connectionLimit, 10);
  this.queueLimit = this._getPropertyNumber(options.queueLimit, 0);
  this.queueTimeout = this._getPropertyNumber(options.queueTimeout, 0);
  this.testOnBorrow = this._getPropertyBoolean(options.testOnBorrow, true);
  this.testOnBorrowInterval = this._getPropertyNumber(options.testOnBorrowInterval, 20000);
  this.initialSize = this._getPropertyNumber(options.initialSize, 0);
  this.maxIdle = Math.min(this.connectionLimit, this._getPropertyNumber(options.maxIdle, 10));
  this.minIdle = Math.min(this.connectionLimit, this._getPropertyNumber(options.minIdle, 0));
  this.maxReuseCount = this._getPropertyNumber(options.maxReuseCount, 0);
  this.timeBetweenEvictionRunsMillis = this._getPropertyNumber(options.timeBetweenEvictionRunsMillis, 0);
  this.numTestsPerEvictionRun = this._getPropertyNumber(options.numTestsPerEvictionRun, 3);
  this.minEvictableIdleTimeMillis = this._getPropertyNumber(options.minEvictableIdleTimeMillis, 1800000);
}

PoolConfig.prototype.newConnectionConfig = function () {
  var newConfig = {};
  var connectionConfig = this.connectionConfig;

  for (var key in connectionConfig) {
    if (connectionConfig.hasOwnProperty(key)) {
      newConfig[key] = connectionConfig[key];
    }
  }

  return newConfig;
};

PoolConfig.prototype._getPropertyNumber = function (value, defaultValue) {
  return value === undefined ? defaultValue : Number(value);
};

PoolConfig.prototype._getPropertyBoolean = function (value, defaultValue) {
  return value === undefined ? defaultValue : Boolean(value);
};

PoolConfig.prototype._parseUrl = function(url) {
  url = urlParse(url, true);

  var options = {
    host     : url.hostname,
    port     : url.port,
    database : url.pathname.substr(1)
  };

  if (url.auth) {
    var auth = url.auth.split(':');
    options.user     = auth.shift();
    options.password = auth.join(':');
  }

  if (url.query) {
    for (var key in url.query) {
      var value = url.query[key];

      try {
        // Try to parse this as a JSON expression first
        options[key] = JSON.parse(value);
      } catch (err) {
        // Otherwise assume it is a plain string
        options[key] = value;
      }
    }
  }

  return options;
};
