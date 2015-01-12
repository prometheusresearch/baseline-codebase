/**
 * @copyright 2014, Prometheus Research LLC
 */
'use strict';

var Storage     = require('../Storage');
var Dispatcher  = require('./Dispatcher');

module.exports = new Storage(Dispatcher);
