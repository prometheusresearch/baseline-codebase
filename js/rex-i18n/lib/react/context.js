/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import React from 'react';
import PropTypes from "prop-types";

import I18N from '../i18n';


export let ProviderContext = {
  /**
   * The current instance of the I18N that should be used within components.
   */
  RexI18N: PropTypes.instanceOf(I18N)
};

