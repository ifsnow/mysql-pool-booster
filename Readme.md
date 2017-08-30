# mysql-pool-booster

[![NPM Version][npm-image]][npm-url]

This is for those who use the connection pool in Node.js + mysql module environment. By adding just a few lines, you can use the connection pool with better performance and useful options than orginal. Please try it once if you're already using the pool of mysql.

If you don't know `mysql` module, you should check out [mysql](https://github.com/mysqljs/mysql) first.

## Table of Contents

- [How to use](#how-to-use)
- [Performance Improvements](#performance-improvements)
- [Useful options](#useful-options)
- [Advanced PoolCluster](#advanced-poolcluster)
- [Additional Features](#additional-features)
- [Restrictions on use](#restrictions-on-use)

## How to use

- Install

 ```bash
 $ npm install mysql-pool-booster
 ```

- Convert `mysql`

 ```js
 var mysql = require('mysql');

 // Converting an existing mysql object
 var MysqlPoolBooster = require('mysql-pool-booster');
 mysql = MysqlPoolBooster(mysql);

 // You can use it just as you used it
 mysql.createPool({ ... });
 ```

- Use the `mysql` just as it used to be

## Performance Improvements

Applying without additional work, your service can be improved 80% or more efficiently.

This is the result of a [performance measurement code](https://gist.github.com/ifsnow/5cc2a628574c2708eb91231c1abe92cd) that handles 30,000 requests.

|  | Original | Booster Version |
| --- | --- | --- |
| Processing per second | 5,877  | 10,650 (181% ↑) |

You can experience a better effect if your service connects to remote mysql server and handles heavy concurrent requests.

## Useful options

It gives you the flexibility to run the pool with many useful options similar to Java's DBCP.

| Option  | Default | Description |
| --- | --- | --- |
| queueTimeout | 0 (off) | The maximum number of milliseconds that the queued request will wait for a connection when there are no available connections. If set to `0`, wait indefinitely. |
| testOnBorrow | true | Indicates whether the connection is validated before borrowed from the pool. If the connection fails to validate, it is dropped from the pool. |
| testOnBorrowInterval | 20000 | The number of milliseconds that indicates how often to validate if the connection is working since it was last used. If set too low, performance may decrease on heavy loaded systems. If set to `0`, It is checked every time. |
| initialSize | 0 (off) | The initial number of connections that are created when the pool is started. If set to `0`, this feature is disabled. |
| maxIdle | 10 | The maximum number of connections that can remain idle in the pool. If set to `0`, there is no limit. |
| minIdle | 0 (off) | The minimum number of connections that can remain idle in the pool. |
| maxReuseCount | 0 (off) | The maximum connection reuse count allows connections to be gracefully closed and removed from the connection pool after a connection has been borrowed a specific number of times. If set to `0`, this feature is disabled. |
| timeBetweenEvictionRunsMillis | 0 (off) | The number of milliseconds to sleep between runs of examining idle connections. The eviction timer will remove existent idle conntions by `minEvictableIdleTimeMillis` or create new idle connections by `minIdle`. If set to `0`, this feature is disabled. |
| minEvictableIdleTimeMillis | 1800000 | The minimum amount of time the connection may sit idle in the pool before it is eligible for eviction due to idle time. If set to `0`, no connection will be dropped. |
| numTestsPerEvictionRun | 3 | The number of connections to examine during each run of the eviction timer (if any). |

## Advanced PoolCluster

`mysql` module has a useful feature called `PoolCluster` to easily handle multiple hosts. If you want to know how to use it, please see this [official document](https://github.com/mysqljs/mysql#poolcluster) first. `mysql-pool-booster` provides more advanced ways to use it.

### Create with options

You can create it with options(`nodes` > `clusterId`) instead of using `add` function. I think this is more useful if you're using the JSON config.

```js
// original version using the function
var cluster = mysql.createPoolCluster({...});

cluster.add('master', {
  host : '...',
  ...
});

cluster.add('slave', {
  host : '...',
  ...
});

// booster version using the options
var cluster = mysql.createPoolCluster({
  ....,
  nodes : [{
    clusterId : 'master',
    host : '...',
    ...
  }, {
    clusterId : 'slave',    
    host : '...',
    ...
  }]
});
```

### Writer & Reader
In many cases, `PoolCluster` is used for the purpose of using the master and slave connection pools, so it provides the concept of `Writer` and `Reader` for easier use. You can set it up with options(`nodes` > `clusterType`) or functions(`addWriter`, `addReader`, `add`).

```js
/**
 * 4 nodes are created.
 * # Writer : No ID
 * # Reader : main, sub, sub2
 */
var cluster = mysql.createPoolCluster({
  ....,
  nodes : [{
    clusterType : 'writer', // without clusterId
    host : '...',
    ...
  }, {
    clusterType : 'reader', // with clusterId
    clusterId : 'main',
    host : '...',
    ...
  }
});

cluster.addReader('sub', {
  host : '...',
  ...
});

cluster.add({  
  clusterType : mysql.CLUSTER_TYPE.READER, // mysql.CLUSTER_TYPE.WRITER
  clusterId : 'sub2',
  host : '...',
  ...
});

// You can get a connection of the Writer group's nodes right away.
// the same as cluster.getWriter().getConnection(...)
cluster.getWriterConnection(function(err, connection) {
  ...
});

// You can get a connection from all of the Reader group's nodes (`main`,` sub`, `sub2`)
cluster.getReaderConnection(function(err, connection) {
  ...
});

// You can get a connection from specific Reader group's nodes (`sub`, `sub2`)
// the same as cluster.getReader('sub*').getConnection(function(err, connection)
cluster.getReaderConnection('sub*', function(err, connection) {
  ...
});
```

### Sharding

If you want to use the application-level [sharding](https://goo.gl/9DdfAK) simply, all you need to do is set it up with options(`shardings`) or `addSharding` function. In complex cases, I think you'd better use another professional sharding platform.

```js
// Create with options
var cluster = mysql.createPoolCluster({
  ....,
  nodes : [{
    clusterId : 'old',
    host : '...',
    ...
  }, {
    clusterId : 'new',    
    host : '...',
    ...
  }],
  shardings : {
    byUserSeq : function(user) {
      return user.seq > 1000000 ? 'new' : 'old';
    }
  }
});

// Add with functions
cluster.addSharding('byTwoParams', function(a, b) {
  return a + b > 10 ? 'new' : 'old';
});
```

You can use the `getSharding` or `getShardingConnection`(`getShardingReaderConnection`, `getShardingWriterConnection`) function with argument to get a connection.

```js
var user = {
  seq : 50000
};

// The connection is based on the user parameter. (In this case, 'old')
// the same as cluster.getSharding('byUserSeq', user).getConnection(...)
cluster.getShardingConnection('byUserNumber', user, function(err, connection) {
  ...
});

// The argument must be an array type if there is more than one.
cluster.getShardingConnection('byTwoParams', [valueA, valueB], function(err, connection) {
  ...
});

// You have to use getReaderConnection() or getWriterConnection() if the nodes are defined as Writer&Reader.
// the same as cluster.getShardingReaderConnection('byUserNumber', user, ...)
cluster.getSharding('byUserNumber', user).getReaderConnection(function(err, connection) {
  ...
});
```

## Additional Features

### prepared

The pool will emit a `prepared` event when the pool is ready to use.
If `initialSize` is set, this is called after all initial connections are created.

```js
pool.on('prepared', function (count) {
  if (count > 0) {
    console.log('Created %d initial connections', count);
  }
});
```

### eviction

The pool will emit a `eviction` event when the eviction timer runs.

```js
pool.on('eviction', function (result) {
  console.log('Removed : %d / Created : %d', connection.removed, connection.created);
});
```

### Monitoring the status of a pool

If you want to know about the status of the pool, use the `getStatus` method. The result of method consists of 4 values(all, use, idle, queue).

```js
var status = pool.getStatus();
console.log('All connected connections : %d', status.all);
console.log('Connections being used : %d', status.use);
console.log('Idle connections : %d', status.idle);
console.log('Queued requests : %d', status.queue);
```

## Restrictions on use

It passes all tests provided by the `mysql` module and provides 100% compatibility. However, there may be some problem if you are using it incorrectly such as accessing private underscore-prefix properties. For example.

```js
// It's a misuse. you must not access private variables
if (pool._allConnections.length > 0) {
  ...
}

// You should use the following method instead
if (pool.getStatus().all > 0) {
  ...
}
```

[npm-image]: https://img.shields.io/npm/v/mysql-pool-booster.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mysql-pool-booster
