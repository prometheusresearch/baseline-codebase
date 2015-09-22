/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling              from 'styling';
import {boxShadow, border,
        rgba, rgb,
        position, cursor}   from 'rex-widget/lib/StyleUtils';

export let self = styling({
  minWidth: 300
});

export let shim = styling({
  cursor: cursor.pointer,
  position: position.absolute,
  zIndex: 10000,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0
});

export let sidebar = styling({
  top: 50,
  width: 150
});
