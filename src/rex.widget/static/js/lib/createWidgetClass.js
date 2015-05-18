/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                   = require('react');
var DataSpecificationMixin  = require('./DataSpecificationMixin');
var Cell                    = require('./Cell');

function createWidgetClass(spec) {
  var mixins = spec.mixins || [];
  mixins.push(Cell.Mixin);
  if (spec.dataSpecs) {
    mixins.push(DataSpecificationMixin);
  }
  spec = {
    ...spec,
    mixins,

    updateStateFor(key) {
      return (value) => {
        var update = {};
        update[key] = value;
        this.setState(update);
      }
    },

    toggleStateFor(key) {
      return () => {
        var update = {};
        update[key] = !this.state[key];
        this.setState(update);
      }
    }
  }
  return React.createClass(spec);
}

module.exports = createWidgetClass;
