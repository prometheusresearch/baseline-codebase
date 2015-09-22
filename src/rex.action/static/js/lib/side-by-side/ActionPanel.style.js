/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {boxShadow, border,
        rgba, rgb,
        position, cursor}   from 'rex-widget/lib/StyleUtils';
import styling              from 'styling';
import * as Style           from './Panel.style';

export let self = styling({
  ...Style.self.rules,
  background: rgb(255, 255, 255),
  boxShadow: boxShadow(0, 0, 6, 2, rgb(204, 204, 204))
});

export let shim = styling({
  ...Style.shim.rules,
  background: rgba(0, 0, 0, 0.05)
});

export let sidebar = Style.sidebar;
