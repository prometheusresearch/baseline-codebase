/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React                   = require('react');
let DataSpecificationMixin  = require('./DataSpecificationMixin');
let Cell                    = require('./Cell');

function createWidgetClass(spec) {
  let mixins = spec.mixins || [];
  mixins.push(Cell.Mixin);
  if (spec.dataSpecs) {
    mixins.push(DataSpecificationMixin);
  }
  spec = {
    ...spec,
    mixins,

    updateStateFor(key) {
      return (value) => {
        let update = {};
        update[key] = value;
        this.setState(update);
      }
    },

    toggleStateFor(key) {
      return () => {
        let update = {};
        update[key] = !this.state[key];
        this.setState(update);
      }
    }
  }
  return React.createClass(spec);
}

module.exports = createWidgetClass;
