/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {boxShadow, rgb} from 'rex-widget/lib/StyleUtils';

export let color = {
  shadowLight: rgb(204, 204, 204)
};

export let shadow = {
  light: boxShadow(0, 0, 1, 0, color.shadowLight)
};
