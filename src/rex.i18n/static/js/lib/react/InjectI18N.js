/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';

import I18NContexted from './I18NContexted';


export default function InjectI18N(WrappedComponent) {
  @I18NContexted
  class InjectedComponent extends React.Component {
    render() {
      return (
        <WrappedComponent
          {...this.props}
          RexI18N={this.context.RexI18N}
          />
      );
    }
  }

  let name = WrappedComponent.displayName || WrappedComponent.name || 'unknown';
  InjectedComponent.displayName = `InjectI18N(${name})`;

  InjectedComponent.propTypes = WrappedComponent.propTypes;

  return InjectedComponent;
}

