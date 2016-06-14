/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import autobind from 'autobind-decorator';
import React from 'react';

import {getInstance} from '../instances';
import {ProviderContext} from './context';


export default class Provider extends React.Component {
  constructor(props, context) {
    super(props, context);

    if (this.context.RexI18N) {
      if (this.context.RexI18N.config.locale === this.props.locale) {
        // If there's an instance already in our context for the same locale,
        // just use it.
        this.state = {RexI18N: this.context.RexI18N};
      } else {
        // If there's an instance already in the context, but it's for a
        // different locale, then make a new one and use that.
        let options = {
          onLoad: this.onI18NLoad,
          timezone: this.props.timezone || this.context.RexI18N.config.timezone,
          baseUrl: this.props.baseUrl || this.context.RexI18N.config.baseUrl,
          translationsUrl: this.props.translationsUrl || this.context.RexI18N.config.translationsUrl
        };
        this.state = {RexI18N: getInstance(this.props.locale, options)};
      }
    } else {
      // An instance doesn't yet exist, make one.
      let options = {
        onLoad: this.onI18NLoad
      };
      ['timezone', 'baseUrl', 'translationsUrl'].forEach((opt) => {
        if (this.props[opt] !== undefined) {
          options[opt] = this.props[opt];
        }
      });
      this.state = {RexI18N: getInstance(this.props.locale, options)};
    }
  }

  @autobind
  onI18NLoad(i18n) {
    if (this.props.onLoad) {
      this.props.onLoad(i18n);
    }
    if (this._mounted) {
      this.forceUpdate();
    }
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.locale !== nextProps.locale) {
      let options = {
        onLoad: this.onI18NLoad,
        timezone: nextProps.timezone || this.state.RexI18N.config.timezone,
        baseUrl: nextProps.baseUrl || this.state.RexI18N.config.baseUrl,
        translationsUrl: nextProps.translationsUrl || this.state.RexI18N.config.translationsUrl
      };
      this.state = {RexI18N: getInstance(nextProps.locale, options)};
    }
  }

  getChildContext() {
    return {
      RexI18N: this.state.RexI18N
    };
  }

  render() {
    return React.Children.only(this.props.children);
  }
}


Provider.propTypes = {
  locale: React.PropTypes.string,
  timezone: React.PropTypes.string,
  baseUrl: React.PropTypes.string,
  translationsUrl: React.PropTypes.string,
  onLoad: React.PropTypes.func,
  children: React.PropTypes.element.isRequired
};

Provider.contextTypes = {
  ...ProviderContext
};

Provider.childContextTypes = {
  ...ProviderContext
};

