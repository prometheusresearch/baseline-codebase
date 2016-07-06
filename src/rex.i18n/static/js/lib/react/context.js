/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';

import I18N from '../i18n';


export let ProviderContext = {
  /**
   * The current instance of the I18N that should be used within components.
   */
  RexI18N: React.PropTypes.instanceOf(I18N),

  /**
   * A flag indicating that the I18N instance has updated, so the components
   * should re-render.
   *
   * Normally you don't need to worry about when the instance updates, as the
   * Provider component will use forceUpdate() to force all downstream
   * components to re-render. But, if you implement a restrictive
   * shouldComponentUpdate(), you'll miss the update. This flag gives you
   * something to check in your logic so that you can update when needed.
   */
  RexI18NUpdated: React.PropTypes.bool
};

