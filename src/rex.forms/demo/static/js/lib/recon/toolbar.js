/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');


var Toolbar = React.createClass({
  propTypes: {
    initialLocale: React.PropTypes.string.isRequired,
    availableLocales: React.PropTypes.array.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    recon: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      locale: this.props.initialLocale
    };
  },

  onChangeValue: function (option, event) {
    this.setState({
      [option]: event.target.value
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  },

  onToggle: function (option) {
    this.setState({
      [option]: !this.state[option]
    }, () => {
      if (this.props.onChange) {
        this.props.onChange(this.state);
      }
    });
  },

  render: function () {
    return (
      <div className='rfd-Toolbar'>
        <div className='rfd-Toolbar__return'>
          <a href={this.props.mountPoint + '/'}>← Go Back</a>
        </div>
        {this.props.recon.validation_errors &&
          <div className='rfd-Toolbar__invalid'>
            <span title={this.props.recon.validation_errors}>
              INVALID CONFIGURATION
            </span>
          </div>
        }
        <div className='rfd-Toolbar__options'>
          <div>
            <select
              value={this.state.locale}
              onChange={this.onChangeValue.bind(this, 'locale')}
              title='Changes the locale the Reconciliation is rendered in'>
              {this.props.availableLocales.map((locale) => {
                return (
                  <option key={locale[0]} value={locale[0]}>{locale[1]}</option>
                );
              })}
            </select>
          </div>
        </div>
      </div>
    );
  }
});


module.exports = Toolbar;

