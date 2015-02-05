/**
 * @copyright 2015, Prometheus Research LLC
 */
'use strict';

var History     = require('../History');
var Dispatcher  = require('./Dispatcher');

module.exports = new History(Dispatcher);

