/**
 * @jsx React.DOM
 */
'use strict';

var React                  = require('react');
var EnumerationWidgetMixin = require('./EnumerationWidgetMixin');
var ItemLabel              = require('./ItemLabel');
var ensureInView           = require('../utils').ensureInView;

var checkGroup = React.createClass({
  mixins: [EnumerationWidgetMixin],

  className: 'rex-forms-checkGroup',

  onChangeCheck: function(e) {
    var nextValue = this.getValue().slice(0);

    if (e.target.checked) {
      nextValue.push(e.target.value);
    } else {
      var idx = nextValue.indexOf(e.target.value);
      if (idx > -1) {
        nextValue.splice(idx, 1);
      }
    }

    this.onChange(nextValue);
  },

  onFocusCheck: function () {
    ensureInView(this.getDOMNode());
  },

  /**
   * Render enumeration descriptor
   *
   * @param {Descriptor} enumeration
   */
  renderEnumeration: function(enumeration) {
    var value = this.getValue();
    var checked = value && value.indexOf(enumeration.id) >= 0;
    return (
      <div className="rex-forms-checkGroup__option" key={enumeration.id}>
        <label>
          <input
            checked={checked}
            type="checkbox"
            name={this.getInputName()}
            onChange={this.onChangeCheck}
            value={enumeration.id}
            onFocus={this.onFocusCheck}
            />
          <ItemLabel
            className="rex-forms-checkGroup__optionLabel"
            label={enumeration.text}
            help={enumeration.help}
            />
        </label>
      </div>
    );
  },

  renderInput: function() {
    return (
      <div>
        {this.getEnumerations().map(this.renderEnumeration)}
      </div>
    );
  }
});

module.exports = checkGroup;
