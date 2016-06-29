/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import invariant from 'invariant';

import {ProviderContext} from './context';


export default function inject(functionalComponent, extraContextTypes = {}) {
  function injectedComponent(props = {}, context = {}) {
    invariant(
      context.RexI18N,
      'Functional components wrapped with inject() can only be used as a descendant of the I18N Provider component.'
    );

    let ctx = {
      getI18N: function () {
        return context.RexI18N;
      },
      _: function (key, variables = {}) {
        return context.RexI18N.gettext(key, variables);
      }
    };

    return functionalComponent.call(ctx, props, context);
  };

  let currentContext = functionalComponent.contextTypes || {};
  injectedComponent.contextTypes = {
    ...currentContext,
    ...ProviderContext,
    ...extraContextTypes
  };

  return injectedComponent;
}

