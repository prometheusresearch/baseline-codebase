/**
 * @copyright 2015, Prometheus Research, LLC
 */

import styling from 'styling';
import {
  boxShadow, border,
  translate3d, rgb, borderStyle,
  overflow, transform
} from 'rex-widget/lib/StyleUtils';

export let self = styling({
  width: '100%',
  height: '100%',
  overflow: overflow.hidden
});

export let breadcrumb = styling({
  width: '100%',
  height: 38,
  boxShadow: boxShadow(0, 0, 1, 0, rgb(226)),
  borderTop: border(1, borderStyle.solid, rgb(234)),
  borderBottom: border(1, borderStyle.solid, rgb(234))
});

export let item = styling({
  marginRight: 15
});

export let items = styling({
  overflow: overflow.hidden,
  width: '100%',
  background: rgb(234)
});

export let itemsCanvas = styling({
  transition: transform(0.5)
});
