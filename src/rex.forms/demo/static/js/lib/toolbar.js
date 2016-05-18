/**
 * @jsx React.DOM
 */

'use strict';

var React = require('react');

var {MODE_EDITOR, MODE_REVIEWER, MODE_VIEWER} = require('./constants');


var Toolbar = React.createClass({
  propTypes: {
    initialLocale: React.PropTypes.string.isRequired,
    availableLocales: React.PropTypes.array.isRequired,
    mountPoint: React.PropTypes.string.isRequired,
    onChange: React.PropTypes.func
  },

  getInitialState: function () {
    return {
      locale: this.props.initialLocale,
      mode: MODE_EDITOR,
      showAssessment: false,
      logFormEvents: false
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
        <div className='rfd-Toolbar__options'>
          <div>
            <label
              title='Displays the current state of the Assessment'>
              <input
                type='checkbox'
                onChange={this.onToggle.bind(this, 'showAssessment')}
                value={this.state.showAssessment}
                />
              Show Assessment
            </label>
          </div>
          <div>
            <label
              title='Logs Form events to the console'>
              <input
                type='checkbox'
                onChange={this.onToggle.bind(this, 'logFormEvents')}
                value={this.state.logFormEvents}
                />
              Log Events
            </label>
          </div>
          <div>
            <select
              value={this.state.mode}
              onChange={this.onChangeValue.bind(this, 'mode')}
              title='Changes the operational mode of the Form'>
              <option value={MODE_EDITOR}>Edit Mode</option>
              <option value={MODE_REVIEWER}>Review Mode</option>
              <option value={MODE_VIEWER}>View Mode</option>
            </select>
          </div>
          <div>
            <select
              value={this.state.locale}
              onChange={this.onChangeValue.bind(this, 'locale')}
              title='Changes the locale the Form is rendered in'>
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

