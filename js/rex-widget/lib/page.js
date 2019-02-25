/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
export {default as Chrome} from './Chrome';
export {default as DynamicPageContent} from './DynamicPageContent';

export {
  getLocation,
  subscribeLocationChange,
  unsubscribeLocationChange,
  updateLocation
} from './PageManager';

export let pageContextTypes = {
  navigationStack: React.PropTypes.array,
};
