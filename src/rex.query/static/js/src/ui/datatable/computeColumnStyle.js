/**
 * @flow
 **/

import type {ColumnSpec} from './DataTable';

type ColumnStyle = {
  flexGrow?: number;
  flexShrink?: number;
  width?: number;
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
    width = override.width,
    maxWidth,
    minWidth
  } = column;
  let flex = width == null
    ? `${flexGrow} ${flexShrink} 0px`
    : undefined;
  let style = {
    flex: flex,
    msFlex: flex,
    WebkitFlex: flex,
    maxWidth: maxWidth,
    minWidth: minWidth,
    width,
  }
  return style;
}
