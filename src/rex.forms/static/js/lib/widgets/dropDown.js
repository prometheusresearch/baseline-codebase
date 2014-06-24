/**
 * @jsx React.DOM
 */

'use strict';

var React       = require('react');
var WidgetMixin = require('./WidgetMixin');

var dropDown = React.createClass({
  mixins: [WidgetMixin],

  className: 'rex-forms-dropDown',

  renderInput: function () {
    var options = this.props.options.enumerations.map((enumeration) =>
      <option key={enumeration.id} value={enumeration.id}>
        {this.localize(enumeration.text)}
      </option>
    );

    // TODO: Refactor for help popups.
    return (
      <select
        className="form-control"
        id={this.getInputName()}
        name={this.getInputName()}
        onChange={this.onChange}
        value={this.getValue()}>

        <option></option>
        {options}
      </select>
    );
  }
});


module.exports = dropDown;
