/**
 * @jsx React.DOM
 */
'use strict';

var React           = require('react');
var ReactForms      = require('react-forms');
var utils           = require('../utils');
var cx              = React.addons.classSet;
var componentMap    = require('../elements').defaultElementComponentMap;
var FormEventsMixin = require('./FormEventsMixin');

var Page = React.createClass({

  mixins: [
    ReactForms.FieldsetMixin,
    FormEventsMixin
  ],

  propTypes: {
    page: React.PropTypes.object.isRequired
  },

  render: function() {
    var elements = this.props.page.elements
      .map(this.renderElement);
    var className = cx(
      'rex-forms-Page',
      'rex-forms-Page-' + this.props.page.id
    );
    return <div className={className}>{elements}</div>;
  },

  renderElement: function(element, idx) {
    var elementComponent = componentMap[element.type];
    var name = element.options ? element.options.fieldId : undefined;
    var events = this.formEvents();

    utils.invariant(
      elementComponent !== undefined,
      "Unknown element type '" + element.type + "'"
    );

    var props = {
      options: element.options,
      key: idx
    };

    if (element.type === 'question') {
      utils.mergeInto(props, {
        name,
        disabled: events.isDisabled(name) || events.isCalculated(name),
        hidden: events.isHidden(name)
      });
    }

    return elementComponent(props);
  }
});


module.exports = Page;
