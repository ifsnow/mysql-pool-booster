# mysql-pool-booster

[![NPM Version][npm-image]][npm-url]

`mysql-pool-booster` easily converts the pool of `mysql` to more faster and improved version. By applying one line, you can use everything. Please try it once if you're already using the pool of mysql.

If you don't know `mysql`, you should check out [mysql](https://github.com/mysqljs/mysql) first.

## Table of Contents

- [How to use](#how-to-use)
- [Improved performance](#improved-performance)
- [Useful options](#useful-options)
- [Usage restrictions](#usage-restrictions)

## How to use

First of all, install a booster module.

 ```bash
 $ npm install mysql-pool-booster
 ```

Wrap `mysql` with the booster module, now you can use converted `mysql` just as you used it.

```js
var mysql = require('mysql');

// converts
var MysqlPoolBooster = require('mysql-pool-booster');
mysql = MysqlPoolBooster(mysql);

// uses as you used it.
mysql.createPool({ ... });
```

## Improved performance

By applying this module, your service could be improved by over 80% without doing anything.

|  | Original | Booster Version |
| --- | --- | --- |
| Executions per second | 5,877  | 10,650 (181% ↑) |

[See a benchmark code](https://gist.github.com/ifsnow/5cc2a628574c2708eb91231c1abe92cd)

## Useful options

It offers more useful options like Commons DBCP.

| Option  | Default | Description |
| --- | --- | --- |
| testOnBorrow | true | Indicates whether the connection is validated before borrowed from the pool. If the connection fails to validate, it is dropped from the pool. |
| testOnBorrowInterval | 20000 | The number of milliseconds that indicates how often to validate if the connection is working since it was last used. If set too low, performance may decrease on heavy loaded systems. If set to `0`, It is checked every time. |
| initialSize | 0 (off) | The initial number of connections that are created when the pool is started. If set to `0`, this feature is disabled. |
| maxIdle | 10 | The maximum number of connections that can remain idle in the pool. If set to `0`, there is no limit. |
| minIdle | 0 (off) | The minimum number of connections that can remain idle in the pool. |
| maxReuseCount | 0 (off) | The maximum connection reuse count allows connections to be gracefully closed and removed from the connection pool after a connection has been borrowed a specific number of times. If set to `0`, this feature is disabled. |
| timeBetweenEvictionRunsMillis | 0 (off) | The number of milliseconds to sleep between runs of examining idle connections. The eviction timer will remove existent idle conntions by `minEvictableIdleTimeMillis` or create new idle connections by `minIdle`. If set to `0`, this feature is disabled. |
| minEvictableIdleTimeMillis | 1800000 | The minimum amount of time the connection may sit idle in the pool before it is eligible for eviction due to idle time. If set to `0`, no connection will be dropped. |
| numTestsPerEvictionRun | 3 | The number of connections to examine during each run of the eviction timer (if any). |

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

## Usage restrictions

It's fully compatible with `mysql`. However, there may be some problem if you are using it incorrectly such as accessing private underscore-prefix properties. That's because `mysql-pool-booster` doesn't offer private properties.

```js
// It's a misuse, so you can't access.
if (pool._allConnections.length > 0) {
  ...
}

// You should use this way.
if (pool.getStatus().all > 0) {
  ...
}
```

[npm-image]: https://img.shields.io/npm/v/mysql-pool-booster.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mysql-pool-booster
