/**
 * @jsx React.DOM
 */
'use strict';


var React = require('react');
var _     = require('../localization')._;


var CalculationResults = React.createClass({
  propTypes: {
    results: React.PropTypes.object,
    onClose: React.PropTypes.func
  },

  render: function () {
    var results;
    if (this.props.results) {
      var keys = Object.keys(this.props.results);
      if (keys.length) {
        results = (
          <table>
            <tbody>
              {keys.sort().map((key) => {
                return (
                  <tr key={key}>
                    <td className="calcname">{key}</td>
                    <td className="calcvalue">{this.props.results[key]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      } else {
        results = (
          <p>{_('This Form has no calculations.')}</p>
        );
      }
    } else {
      results = (
        <p>{_('Running calculations...')}</p>
      );
    }

    return (
      <div className="rex-forms-CalculationResults">
        <h3>{_('Calculations Preview')}</h3>
        <div className="rex-forms-CalculationResults__results">
          {results}
        </div>
        <button
          className="rex-forms-CalculationResults__close"
          onClick={this.props.onClose}>
          {_('Close')}
        </button>
      </div>
    );
  }
});


module.exports = CalculationResults;

