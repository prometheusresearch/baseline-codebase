/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var $ = require('jquery');
var React = require('react/addons');

var Form = require('rex-forms').Form;
var LocaleChooser = require('./LocaleChooser');
var ChannelChooser = require('./ChannelChooser');
var CalculationResults = require('./CalculationResults');
var Spinny = require('./Spinny');
var localization = require('./localization');
var _ = localization.gettext;


var FormPreviewer = React.createClass({
  propTypes: {
    instrument: React.PropTypes.object.isRequired,
    forms: React.PropTypes.object.isRequired,
    locale: React.PropTypes.string,
    avilableLocales: React.PropTypes.arrayOf(React.PropTypes.arrayOf(React.PropTypes.string)),
    channels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    initialChannel: React.PropTypes.string.isRequired,
    returnUrl: React.PropTypes.string,
    completeUrl: React.PropTypes.string.isRequired,
    instrumentId: React.PropTypes.string.isRequired,
    category: React.PropTypes.string.isRequired,
    localResourcePrefix: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      locale: 'en',
      availableLocales: []
    };
  },

  getInitialState: function () {
    return {
      locale: this.props.locale,
      currentForm: this.props.forms[this.props.initialChannel],
      lastResults: null,
      processing: false
    };
  },

  onLocaleChange: function (locale) {
    // TODO: Shouldn't hardcode this here.
    var RTL_LOCALES = ['ar', 'fa', 'ps', 'he', 'ur'];

    this.setState({
      locale: locale
    }, () => {
      var direction = 'ltr';
      if (RTL_LOCALES.indexOf(locale) > -1) {
        direction = 'rtl';
      }
      document.getElementsByTagName('html')[0].dir = direction;

      localization.switchLocale(locale, () => {
        this.forceUpdate();
      });
    });
  },

  onChannelChange: function (channel) {
    this.setState({
      currentForm: this.props.forms[channel],
      lastResults: null
    });
  },

  onReturn: function (event) {
    event.preventDefault();
    window.top.location = this.props.returnUrl;
  },

  onComplete: function (assessment) {
    var payload = {
      data: JSON.stringify(assessment),
      instrument_id: this.props.instrumentId,
      category: this.props.category
    };

    this.setState({
      processing: true,
      lastResults: null
    });

    $.ajax({
      url: this.props.completeUrl,
      type: 'POST',
      data: payload,
      dataType: 'json'
    }).then(
      (data) => {
        if (data.status === 'SUCCESS') {
          this.setState({
            processing: false,
            lastResults: data.results
          });
        } else {
          alert(_('Calculations Failed:') + '\n\n' + data.message);
          this.setState({
            processing: false
          });
        }
      },
      () => {
        alert(_('There was an error when trying to complete the Form. Please try again later.'));
        this.setState({
          processing: false
        });
      }
    );
  },

  render: function () {
    var hasMultipleForms = Object.keys(this.props.forms).length > 1;
    var hasMultipleLocales = this.props.availableLocales.length > 1;
    var hasResults = this.state.lastResults ? true : false;

    return (
      <div className="form-previewer">
        <div className="previewer-tools">
          {hasMultipleLocales &&
            <LocaleChooser
              locales={this.props.availableLocales}
              currentLocale={this.state.locale}
              onChange={this.onLocaleChange}
              />
          }
          {hasMultipleForms &&
            <ChannelChooser
              channels={this.props.channels}
              initialChannel={this.props.initialChannel}
              onChange={this.onChannelChange}
              />
          }
        </div>
        <Form
          instrument={this.props.instrument}
          form={this.state.currentForm}
          readOnly={hasResults}
          showOverview={hasResults}
          showOverviewOnCompletion={true}
          locale={this.state.locale}
          onComplete={this.onComplete}
          localResourcePrefix={this.props.localResourcePrefix}
          />
        {this.state.processing &&
          <Spinny />
        }
        {hasResults &&
          <CalculationResults
            results={this.state.lastResults}
            />
        }
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

