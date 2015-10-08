/*
 * Copyright (c) 2015, Prometheus Research, LLC
 */

'use strict';

var React = require('react');
var ReactForms = require('react-forms');
var {Map} = require('immutable');

var _ = require('../i18n').gettext;



var LocaleChoiceTable = React.createClass({
  propTypes: {
    locales: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    coverages: React.PropTypes.object.isRequired,
    value: React.PropTypes.string,
    onChange: React.PropTypes.func
  },

  onChange: function (locale) {
    if (this.props.onChange) {
      this.props.onChange(locale);
    }
  },

  buildLocales: function () {
    return this.props.locales.map((locale, idx) => {
      var id = 'formLocale-' + locale.id + '-' + idx;
      return (
        <tr key={idx}>
          <td>
            <input
              id={id}
              checked={locale.id === this.props.value}
              type='radio'
              name={this._rootNodeID}
              value={locale.id}
              onChange={this.onChange.bind(null, locale.id)}
              />
          </td>
          <td>
            <label
              className='rfb-formlocalization-locale'
              htmlFor={id}>
              {locale.name.current}
            </label>
          </td>
          <td>{Math.floor((this.props.coverages[locale.id] / this.props.coverages.total) * 100)}%</td>
        </tr>
      );
    });
  },

  render: function () {
    var locales = this.buildLocales();

    return (
      <table>
        <tr>
          <th></th>
          <th>{_('Language')}</th>
          <th
            title={_('How much of the configurable text is in this language.')}>
            {_('Configuration Coverage')}
          </th>
        </tr>
        {locales}
      </table>
    );
  }
});


class FormLocalization extends ReactForms.schema.ScalarNode {
  static create(props) {
    var {I18NStore, DraftSetStore} = require('../stores');

    props = props || {};
    props.locales = I18NStore.getSupportedLocales();
    props.component = (
      <ReactForms.Field
        className='rfb-formlocalization'
        />
    );
    props.input = (
      <LocaleChoiceTable
        locales={props.locales}
        coverages={DraftSetStore.getLocaleCoverage()}
        />
    );

    /*eslint new-cap:0 */
    return new this(Map(props));
  }

  validate(value, childrenValidation) {
    var error = super.validate(value, childrenValidation);
    if (error) {
      return error;
    }

    if (value) {
      var allowedChoices = this.props.get('locales').map((locale) => {
        return locale.id;
      });
      if (allowedChoices.indexOf(value) < 0) {
        return new Error(_('Not a valid choice.'));
      }
    }
  }
}


module.exports = FormLocalization;

