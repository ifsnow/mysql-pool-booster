var Pool = require('./lib/Pool');
var PoolConfig = require('./lib/PoolConfig');
var PoolCluster = require('./lib/PoolCluster');

module.exports = function(mysql) {
  /**
   * Create a new Pool instance.
   * @param {object} mysql MySQL Instance
   * @param {object|string} config Configuration or connection string for new MySQL connections
   * @return {Pool} A new MySQL pool
   * @public
   */

  mysql.createPool = function(config) {
    return new Pool(mysql, {config: new PoolConfig(mysql, config)});
  };

  /**
   * Create a new PoolCluster instance.
   * @param {object} mysql MySQL Instance
   * @param {object} [config] Configuration for pool cluster
   * @return {PoolCluster} New MySQL pool cluster
   * @public
   */

  mysql.createPoolCluster = function createPoolCluster(config) {
    return new PoolCluster(mysql, config);
  };

  mysql.CLUSTER_TYPE = {
    WRITER : 'writer',
    READER : 'reader'
  };

  return mysql;
};
