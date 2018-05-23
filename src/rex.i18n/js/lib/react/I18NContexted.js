/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import invariant from 'invariant';

import {ProviderContext} from './context';
import componentName from './componentName';


export default function I18NContexted(WrappedComponent) {
  let name = componentName(WrappedComponent) || 'I18NContexted';

  class ContextedComponent extends WrappedComponent {
    constructor(props, context) {
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

  ContextedComponent.displayName = name;

  return ContextedComponent;
}

