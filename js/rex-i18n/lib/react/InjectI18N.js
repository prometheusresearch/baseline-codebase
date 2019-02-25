/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';
import invariant from 'invariant';

import I18NContexted from './I18NContexted';
import componentName from './componentName';


export default function InjectI18N(WrappedComponent) {
  let name = componentName(WrappedComponent) || 'InjectI18N';

  class InjectedComponent extends WrappedComponent {
    constructor(props, context) {
      invariant(
        context.RexI18N,
        `The ${name} component can only be used as a descendant of the I18N Provider component.`
      );
      super(props, context);
    }

    getI18N() {
      return this.context.RexI18N;
    }

    _(key, variables = {}) {
      return this.getI18N().gettext(key, variables);
    }
  }

  InjectedComponent.displayName = name;

  return I18NContexted(InjectedComponent);
}

