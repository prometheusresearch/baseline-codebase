/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var React = require('react/addons');

var _ = require('./localization').gettext;


var CalculationResults = React.createClass({
  propTypes: {
    results: React.PropTypes.object.isRequired
  },

  render: function () {
    var calculations = Object.keys(this.props.results).sort().map((key) => {
      return (
        <tr key={key}>
          <td className="calculation-name">{key}</td>
          <td className="calculation-value">{this.props.results[key]}</td>
        </tr>
      );
    });

    return (
      <div className="calculation-results">
        <h2>{_('Summary Calculations')}</h2>
        <table>
          <tbody>
            {calculations}
          </tbody>
        </table>
      </div>
    );
  }
});


module.exports = CalculationResults;

