/**
 * @flow
 **/

import type {ColumnSpec} from './DataTable';

type ColumnStyle = {
  flexGrow?: number;
  flexShrink?: number;
};

export default function computeColumnStyle(
  column: ColumnSpec<*>,
  override?: ColumnStyle
): Object {
  if (override == null) {
    override = {};
  }
  let {
    flexGrow = override.flexGrow != null ? override.flexGrow : 1,
    flexShrink = override.flexShrink != null ? override.flexShrink : 1,
    width = 0,
    maxWidth,
    minWidth
  } = column;
  let flex = `${flexGrow} ${flexShrink} ${width}px`;
  let style = {
    flex: flex,
    msFlex: flex,
    WebkitFlex: flex,
    maxWidth: maxWidth,
    minWidth: minWidth,
  }
  return style;
}
