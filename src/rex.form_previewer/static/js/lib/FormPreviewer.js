/**
 * Copyright (c) 2015, Prometheus Research, LLC
 *
 * @jsx React.DOM
 */

'use strict';

var $ = require('jquery');
var React = require('react/addons');

var Form = require('rex-forms').Form;
var ReactForms = require('react-forms');
var {Schema, Property} = ReactForms.schema;
var LocaleChooser = require('./LocaleChooser');
var ChannelChooser = require('./ChannelChooser');
var CalculationResults = require('./CalculationResults');
var Spinny = require('./Spinny');
var localization = require('./localization');
var _ = localization.gettext;


var BooleanInput = React.createClass({
  render: function () {
    return this.transferPropsTo(
      <select
        id={this.props.id || this.props.name}>
        <option
          key={'null'}>
          {_('null')}
        </option>
        <option
          key={'true'}
          value={true}>
          {_('True')}
        </option>
        <option
          key={'false'}
          value={false}>
          {_('False')}
        </option>
      </select>
    );
  }
});


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
    localResourcePrefix: React.PropTypes.string,
    lookupApiPrefix: React.PropTypes.string
  },

  getDefaultProps: function () {
    return {
      locale: 'en',
      availableLocales: []
    };
  },

  getInitialState: function () {
    var currentForm = this.props.forms[this.props.initialChannel]
    var parameters = currentForm.parameters ? null : {};

    return {
      locale: this.props.locale,
      currentForm,
      lastResults: null,
      processing: false,
      parameters
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
    var currentForm = this.props.forms[channel]
    var parameters = currentForm.parameters ? null : {};

    this.setState({
      currentForm,
      lastResults: null,
      parameters
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

  createParameterFormSchema: function () {
    var properties = Object.keys(this.state.currentForm.parameters).sort().map((id) => {
      var type = null, input = undefined;
      switch (this.state.currentForm.parameters[id].type) {
        case 'text':
          type = 'string';
          break;
        case 'numeric':
          type = 'number';
          break;
        case 'boolean':
          type = 'bool';
          input = (<BooleanInput />);
          break;
      }

      return (
        <Property
          name={id}
          label={id}
          type={type}
          input={input}
          />
      );
    });

    return (
      <Schema>
        {properties}
      </Schema>
    );
  },

  getParameterFormDefaults: function () {
    var defaults = {};
    Object.keys(this.state.currentForm.parameters).forEach((id) => {
      defaults[id] = null;
    });
    return defaults;
  },

  onSetParameters: function () {
    var value = this.refs.parameterForm.value();
    if (ReactForms.validation.isSuccess(value.validation)) {
      this.setState({
        parameters: value.value
      });
    }
  },

  onResetParameters: function () {
    this.setState({
      parameters: null
    });
  },

  render: function () {
    var hasMultipleForms = Object.keys(this.props.forms).length > 1;
    var hasMultipleLocales = this.props.availableLocales.length > 1;
    var hasResults = this.state.lastResults ? true : false;
    var needsParameters = this.state.parameters === null;
    var hasParameters = !needsParameters && Object.keys(this.state.parameters).length > 0;

    return (
      <div className="form-previewer">
        <div className="previewer-tools">
          {hasParameters &&
            <div className="parameter-reseter">
              <button
                className="btn btn-default"
                onClick={this.onResetParameters}>
                {_('Reset Parameters')}
              </button>
            </div>
          }
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
        {needsParameters ?
          <div className="parameter-gatherer">
            <h2>{_('Please Enter Parameter Values')}</h2>
            <p>{_('This form expects to receive the following parameters from the system when it is used in real situations. Please enter these values by hand to facilitate your testing.')}</p>
            <ReactForms.Form
              ref="parameterForm"
              schema={this.createParameterFormSchema()}
              defaultValue={this.getParameterFormDefaults()}
            />
            <button
              onClick={this.onSetParameters}>
              {_('Use These Values')}
            </button>
          </div>
          :
          <Form
            instrument={this.props.instrument}
            form={this.state.currentForm}
            readOnly={hasResults}
            showOverview={hasResults}
            showOverviewOnCompletion={true}
            locale={this.state.locale}
            onComplete={this.onComplete}
            localResourcePrefix={this.props.localResourcePrefix}
            parameters={this.state.parameters}
            lookupApiPrefix={this.props.lookupApiPrefix}
            />
        }
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

