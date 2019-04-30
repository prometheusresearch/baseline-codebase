/**
 * Copyright (c) 2015, Prometheus Research, LLC
 */

import React from 'react';
import PropTypes from 'prop-types';

import {InjectI18N} from 'rex-i18n';
import {VBox, HBox} from '@prometheusresearch/react-ui';


export default InjectI18N(class LocaleChooser extends React.Component {

  static propTypes = {
    locales: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)),
    currentLocale: PropTypes.string.isRequired,
    onChange: PropTypes.func
  };

  static defaultProps = {
    onChange: function () {},
  };

  renderLocales() {
    return this.props.locales.map((locale) => {
      return (
        <option
          value={locale[0]}
          key={locale[0]}>
          {locale[1]}
        </option>
      );
    });
  }

  onChange(event) {
    this.props.onChange(event.target.value);
  }

  render() {
    return (
      <HBox marginLeft='20px'>
        <HBox marginRight='10px'>{this._('Display in Language:')}</HBox>
        <HBox>
          <select
            value={this.props.currentLocale}
            onChange={this.onChange.bind(this)}>
            {this.renderLocales()}
          </select>
        </HBox>
      </HBox>
    );
  }
});
