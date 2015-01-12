/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

var ApplicationState = require('../ApplicationState');
var Dispatcher       = require('./Dispatcher');

module.exports = new ApplicationState(Dispatcher);
