/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling from 'styling';
import {self as buttonSelf}  from './Button.style';

export let leftButton = styling({
  ...buttonSelf.rules,
  borderBottomRightRadius: 0,
  borderTopRightRadius: 0,
  borderRight: 'none',
});

export let middleButton = styling({
  ...buttonSelf.rules,
  borderRadius: 0,
  borderRight: 'none',
});

export let rightButton = styling({
  ...buttonSelf.rules,
  borderBottomLeftRadius: 0,
  borderTopLeftRadius: 0,
});
