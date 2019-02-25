/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from "react";
import * as ReactForms from "react-forms";
import { VBox, HBox } from "@prometheusresearch/react-ui";

import { FormEditor } from "rex-forms";
import { Provider, InjectI18N } from "rex-i18n";

import LocaleChooser from "./LocaleChooser";
import ChannelChooser from "./ChannelChooser";

const BooleanInput = ReactForms.withFormValue(
  class extends React.Component {
    static OPTIONS = [null, true, false];

    onChange = event => {
      this.constructor.OPTIONS.forEach(option => {
        if (String(option) === event.target.value) {
          this.props.formValue.update(option);
        }
      });
    };

    render() {
      return (
        <select value={this.props.formValue.value} onChange={this.onChange}>
          {this.constructor.OPTIONS.map((option, idx) => {
            return (
              <option key={idx} value={String(option)}>
                {String(option)}
              </option>
            );
          })}
        </select>
      );
    }
  }
);

const NumberInput = ReactForms.withFormValue(
  class extends React.Component {
    onChange = event => {
      let value = event.target.value;
      if (value === null || value === "") {
        this.props.formValue.update(null);
      } else {
        let number = Number(value);
        this.props.formValue.update(isNaN(number) ? value : number);
      }
    };

    render() {
      return (
        <input value={this.props.formValue.value} onChange={this.onChange} />
      );
    }
  }
);

export default InjectI18N(
  class FormPreviewer extends React.Component {
    static propTypes = {
      instrument: React.PropTypes.object.isRequired,
      forms: React.PropTypes.object.isRequired,
      locale: React.PropTypes.string,
      avilableLocales: React.PropTypes.arrayOf(
        React.PropTypes.arrayOf(React.PropTypes.string)
      ),
      channels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
      initialChannel: React.PropTypes.string.isRequired,
      localResourcePrefix: React.PropTypes.string,
      lookupApiPrefix: React.PropTypes.string,
      calculationApiPrefix: React.PropTypes.string
    };

    static defaultProps = {
      locale: "en",
      availableLocales: ["en"]
    };

    constructor(props) {
      super(props);

      let currentForm = props.forms[props.initialChannel];
      let parameterForm = null;
      if (Object.keys(currentForm.parameters || {}).length > 0) {
        parameterForm = ReactForms.createValue({
          schema: this.createParameterFormSchema(currentForm),
          onChange: this.onParametersChange.bind(this)
        });
      }

      this.state = {
        locale: props.locale,
        currentForm,
        currentChannel: props.initialChannel,
        processing: false,
        parameters: null,
        parameterForm
      };
    }

    onChannelChange(channel) {
      let currentForm = this.props.forms[channel];
      let parameterForm = null;
      if (Object.keys(currentForm.parameters || {}).length > 0) {
        parameterForm = ReactForms.createValue({
          schema: this.createParameterFormSchema(currentForm),
          onChange: this.onParametersChange.bind(this)
        });
      }

      this.setState({
        currentForm,
        currentChannel: channel,
        parameters: null,
        parameterForm
      });
    }

    onLocaleChange(locale) {
      this.setState({
        locale: locale
      });
    }

    createParameterFormSchema(form) {
      let schema = {
        type: "object",
        properties: {}
      };

      form = form || this.state.currentForm;

      Object.keys(form.parameters).forEach(param => {
        switch (form.parameters[param].type) {
          case "text":
            schema.properties[param] = { type: "string" };
            break;
          case "numeric":
            schema.properties[param] = { type: "number" };
            break;
          case "boolean":
            schema.properties[param] = { type: "boolean" };
            break;
        }
      });

      return schema;
    }

    createParameterForm(form) {
      form = form || this.state.currentForm;
      let fields = Object.keys(form.parameters)
        .sort()
        .map(param => {
          let input;
          if (form.parameters[param].type === "boolean") {
            input = BooleanInput;
          } else if (form.parameters[param].type === "numeric") {
            input = NumberInput;
          }

          return (
            <VBox marginBottom="10px" key={param}>
              <ReactForms.Field select={param} label={param} Input={input} />
            </VBox>
          );
        });
      return (
        <ReactForms.Fieldset formValue={this.state.parameterForm}>
          {fields}
        </ReactForms.Fieldset>
      );
    }

    onParametersChange(formValue) {
      this.setState({ parameterForm: formValue });
    }

    onSetParameters() {
      let { ...params } = this.state.parameterForm.value;
      Object.keys(this.state.currentForm.parameters).forEach(param => {
        if (params[param] === undefined) {
          params[param] = null;
        }
      });
      this.setState({
        parameters: params
      });
    }

    onResetParameters() {
      this.setState({
        parameters: null
      });
    }

    render() {
      let hasMultipleForms = Object.keys(this.props.forms).length > 1;
      let hasMultipleLocales = this.props.availableLocales.length > 1;

      let needsParameters =
        Object.keys(this.state.currentForm.parameters || {}).length > 0;
      let hasParameters = Object.keys(this.state.parameters || {}).length > 0;
      let parameterErrors =
        needsParameters &&
        this.state.parameterForm.completeErrorList.length > 0;

      return (
        <VBox>
          <HBox justifyContent="flex-end" marginBottom="10px">
            {hasParameters && (
              <div>
                <button
                  className="btn btn-default"
                  onClick={this.onResetParameters.bind(this)}
                >
                  {this._("Change Parameters")}
                </button>
              </div>
            )}
            {hasMultipleLocales && (
              <LocaleChooser
                locales={this.props.availableLocales}
                currentLocale={this.state.locale}
                onChange={this.onLocaleChange.bind(this)}
              />
            )}
            {hasMultipleForms && (
              <ChannelChooser
                channels={this.props.channels}
                initialChannel={this.props.initialChannel}
                onChange={this.onChannelChange.bind(this)}
              />
            )}
          </HBox>
          {needsParameters && !hasParameters ? (
            <div className="parameter-gatherer">
              <h2>{this._("Please Enter Parameter Values")}</h2>
              <p>
                {this._(
                  "This form expects to receive the following parameters from the system when it is used in real situations. Please enter these values by hand to facilitate your testing."
                )}
              </p>
              {this.createParameterForm()}
              <button
                onClick={this.onSetParameters.bind(this)}
                disabled={parameterErrors}
              >
                {this._("Use These Values")}
              </button>
            </div>
          ) : (
            <div key={`${this.state.currentChannel}-${this.state.locale}`}>
              <Provider
                locale={this.state.locale}
                baseUrl={this.props.i18nBaseUrl}
              >
                <FormEditor
                  instrument={this.props.instrument}
                  form={this.state.currentForm}
                  parameters={this.state.parameters}
                  onComplete={this.onFormComplete}
                  showCalculations={true}
                  apiUrls={{
                    lookup: this.props.lookupApiPrefix,
                    calculation: this.props.calculationApiPrefix
                  }}
                />
              </Provider>
            </div>
          )}
        </VBox>
      );
    }
  }
);
