/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import invariant from 'invariant';

import {ProviderContext} from './context';


export default function I18NContexted(WrappedComponent) {
  class ContextedComponent extends WrappedComponent {
    constructor(props, context) {
      let name = WrappedComponent.displayName || WrappedComponent.name || 'wrapped';
      invariant(
        context.RexI18N,
        `The ${name} component can only be used as a descendant of the I18N Provider component.`
      );
      super(props, context);
    }
  }

  ContextedComponent.contextTypes = {
    ...WrappedComponent.contextTypes,
    ...ProviderContext
  };

  return ContextedComponent;
}

