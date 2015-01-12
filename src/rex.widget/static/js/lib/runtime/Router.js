/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

var Router     = require('../Router');
var Dispatcher = require('./Dispatcher');

module.exports = new Router(Dispatcher);
