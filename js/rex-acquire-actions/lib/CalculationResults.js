/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {InjectI18N} from 'rex-i18n';


export default InjectI18N(class CalculationResults extends React.Component {
  static propTypes = {
    results: React.PropTypes.object.isRequired
  };

  render() {
    var calculations = Object.keys(this.props.results).sort().map((key) => {
      return (
        <tr key={key}>
          <td style={{paddingRight: '10px', fontWeight: 'bold'}}>{key}</td>
          <td>{this.props.results[key]}</td>
        </tr>
      );
    });

    return (
      <div className="calculation-results">
        <h2>{this._('Summary Calculations')}</h2>
        <table>
          <tbody>
            {calculations}
          </tbody>
        </table>
      </div>
    );
  }
});

