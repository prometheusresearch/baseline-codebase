/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {InjectI18N} from 'rex-i18n';


// TODO: styling


@InjectI18N
export default class CalculationResults extends React.Component {
  static propTypes = {
    results: React.PropTypes.object.isRequired
  };

  render() {
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
        <h2>{this._('Summary Calculations')}</h2>
        <table>
          <tbody>
            {calculations}
          </tbody>
        </table>
      </div>
    );
  }
}

