/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling              from 'styling';
import * as Style           from './Panel.style';
import {item as wizardItem} from './Wizard.style';

export {shim, sidebar}      from './Panel.style';

export let self = styling({
  ...Style.self.rules,
  marginLeft: -wizardItem.rules.marginRight
});

export let action = styling({
  width: 150
});

export let header = styling({
  height: 25,
  margin: 0,
  padding: '5px 10px',
  color: '#999',
  borderBottom: '1px solid #ccc',
});

export let nextActions = styling({
  top: 25,
});
