/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var React = require('react/addons');

var _ = require('./localization').gettext;
var Form = require('rex-forms').Form;
var ChannelChooser = require('./ChannelChooser');


var FormPreviewer = React.createClass({
  propTypes: {
    instrument: React.PropTypes.object.isRequired,
    forms: React.PropTypes.object.isRequired,
    locale: React.PropTypes.string,
    channels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    initialChannel: React.PropTypes.string.isRequired,
    returnUrl: React.PropTypes.string,
    localResourcePrefix: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      locale: 'en'
    };
  },

  getInitialState: function () {
    return {
      currentForm: this.props.forms[this.props.initialChannel]
    };
  },

  onChannelChange: function (channel) {
    this.setState({
      currentForm: this.props.forms[channel]
    });
  },

  onReturn: function (event) {
    event.preventDefault();
    window.top.location = this.props.returnUrl;
  },

  onComplete: function () {
    alert(_('This is only a preview of the Form, you can\'t actually submit any data here.'));
  },

  render: function () {
    var hasMultipleForms = Object.keys(this.props.forms).length > 1;

    return (
      <div className="form-previewer">
        {hasMultipleForms &&
          <ChannelChooser
            channels={this.props.channels}
            initialChannel={this.props.initialChannel}
            onChange={this.onChannelChange}
            />
        }
        <Form
          instrument={this.props.instrument}
          form={this.state.currentForm}
          showOverviewOnCompletion={true}
          locale={this.props.locale}
          onComplete={this.onComplete}
          localResourcePrefix={this.props.localResourcePrefix}
          />
        {this.props.returnUrl &&
          <div className="returner">
            <button
              className="btn btn-primary"
              onClick={this.onReturn}>
              {_('Return to Previous Screen')}
            </button>
          </div>
        }
      </div>
    );
  }
});


module.exports = FormPreviewer;

