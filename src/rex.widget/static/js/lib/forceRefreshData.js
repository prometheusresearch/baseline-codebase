/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {forceRefreshData as forceRefreshDataLegacy} from './DataSpecificationMixin';
import {forceRefresh} from './data/DataComponentRegistry';

export default function forceRefreshData() {
  forceRefreshDataLegacy();
  forceRefresh();
}
