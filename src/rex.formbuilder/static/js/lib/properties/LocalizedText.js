/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Message, Label, Input, Element, Field} = ReactForms;
var classNames = require('classnames');
var {Map, OrderedMap} = require('immutable');
var {isEmpty, isEmptyLocalization} = require('../util');
var _ = require('../i18n').gettext;


var RTL_LOCALES = ['ar', 'fa', 'ps', 'he', 'ur'];


var LocalizedTextField = React.createClass({
  propTypes: {
    value: ReactForms.PropTypes.Value,
    label: React.PropTypes.string,
    hint: React.PropTypes.string,
    noLabel: React.PropTypes.bool
  },

  getInitialState: function () {
    return {
      showAll: false
    };
  },

  onEditAll: function () {
    this.setState({
      showAll: !this.state.showAll
    });
  },

  render: function () {
    var {value, hint, label, ...props} = this.props;
    var {node, validation, isDirty, externalValidation} = value;
    var isInvalid = isDirty && (validation.isFailure || externalValidation.isFailure);

    var classes = classNames({
      'rf-Field': true,
      'rf-Field--invalid': isInvalid,
      'rf-Field--dirty': isDirty,
      'rf-Field--required': node.props.get('required'),
      'rfb-localizedtext': true
    });

    var id = this._rootNodeID;
    var translateLabel = this.state.showAll ? _('Hide Translations') : _('Translate');

    return (
      <div {...props} className={classes}>
        {!this.props.noLabel &&
          <Label
            htmlFor={id}
            className='rf-Field__label'
            label={label || node.props.get('label')}
            hint={hint || node.props.get('hint')}
            />
        }
        {!this.state.showAll &&
        <Input
          id={id}
          dir={RTL_LOCALES.indexOf(node.props.get('formLocale')) >= 0 ? 'rtl' : 'ltr'}
          value={value.get(node.props.get('formLocale'))}
          dirtyOnBlur={node.props.get('dirtyOnBlur', true)}
          dirtyOnChange={node.props.get('dirtyOnChange', true)}
          />
        }
        <button
          onClick={this.onEditAll}>
          <span className='rfb-icon icon-locale' />
          {translateLabel}
        </button>
        {this.state.showAll &&
          <div
            className='rfb-localizedtext-translations'>
            {value.map((value, key) => {
              return (
                <Field
                  key={key}
                  value={value}
                  input={
                    <input
                      dir={RTL_LOCALES.indexOf(key) >= 0 ? 'rtl' : 'ltr'}
                      />
                  }
                  />
              );
            })}
          </div>
        }
        {validation.isFailure &&
          <Message>{validation.error}</Message>}
        {externalValidation.isFailure &&
          <Message>{externalValidation.error}</Message>}
      </div>
    );
  }
});


class LocalizedText extends ReactForms.schema.MappingNode {
  static create(props) {
    /*eslint new-cap:0 */
    props = props || {};
    props.required = props.required || false;

    var {I18NStore, DraftSetStore} = require('../stores');

    props.formLocale = DraftSetStore.getActiveConfiguration().locale;

    var children = {};
    I18NStore.getSupportedLocales().forEach((locale) => {
      children[locale.id] = ReactForms.schema.Scalar({
        label: locale.name.current,
        required: props.required && (locale.id === props.formLocale)
      });
    });
    props.children = OrderedMap(children);

    props.component = LocalizedTextField;

    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    var rawValue = value.toJS();
    if (!isEmptyLocalization(rawValue)) {
      if (isEmpty(rawValue[this.props.get('formLocale')])) {
        return new Error(
          _('You must provide a translation for the default locale (%(locale)s).', {
            locale: this.props.get('formLocale')
          })
        )
      }
    }
  }
}


module.exports = LocalizedText;

