/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import type {fontWeight} from 'react-stylesheet/lib/CSSType';
import {style, css} from 'react-stylesheet';
import {stylesheet as StylesheetBase} from './ButtonBase';
import theme from './theme';

export type FontSize = {
  xSmall: number,
  small: number,
  normal: number,
  large: number,
};

export type Size = {
  xSmall: number,
  small: number,
  normal: number,
  large: number,
};

export type ButtonStylesheet = {
  raised: boolean,

  width?: Size,
  height?: Size,

  borderRadius?: number,

  textWidth: fontWeight,
  textSize?: FontSize | string,

  text: string,
  textHover: string,
  textFocus: string,
  textActive: string,
  textDisabled: string,

  background: string,
  backgroundHover: string,
  backgroundFocus: string,
  backgroundActive: string,
  backgroundDisabled: string,

  border?: string,
  borderHover?: string,
  borderFocus?: string,
  borderActive?: string,
  borderDisabled?: string,

  shadow?: string,
  shadowHover?: string,
  shadowFocus?: string,
  shadowActive?: string,

  shadowFocusRing?: string,
};

let noBorder = {width: 1, color: 'transparent', style: 'solid'};

let defaultTextSize: FontSize = {
  xSmall: 10,
  small: 12,
  normal: 14,
  large: 16,
};

let defaultBorderRadius = 2;

let defaultHeight = {
  xSmall: undefined,
  small: undefined,
  normal: undefined,
  large: undefined,
};

let defaultWidth = {
  xSmall: undefined,
  small: undefined,
  normal: undefined,
  large: undefined,
};

export function create(stylesheet: ButtonStylesheet) {
  let {
    textSize = defaultTextSize,
    height = defaultHeight,
    width = defaultWidth,
    borderRadius = defaultBorderRadius,
    shadowFocusRing = 'none',
  } = stylesheet;

  let colors = {
    background: theme.button.backgroundColor || stylesheet.background,
    color: theme.button.textColor || stylesheet.text,
    border: css.border(
      1,
      css.border.solid,
      theme.button.borderColor || stylesheet.border,
    ),
  };

  let hoverColors = {
    background: theme.button.hover.backgroundColor ||
      stylesheet.backgroundHover ||
      stylesheet.background,
    color: theme.button.hover.textColor || stylesheet.textHover || stylesheet.text,
    border: css.border(
      1,
      css.border.solid,
      theme.button.hover.borderColor || stylesheet.borderHover || stylesheet.border,
    ),
  };

  let focusColors = {
    background: theme.button.focus.backgroundColor ||
      stylesheet.backgroundFocus ||
      stylesheet.background,
    color: theme.button.focus.textColor || stylesheet.textFocus || stylesheet.text,
    border: css.border(
      1,
      css.border.solid,
      theme.button.focus.borderColor || stylesheet.borderFocus || stylesheet.border,
    ),
  };

  let activeColors = {
    background: theme.button.active.backgroundColor ||
      stylesheet.backgroundActive ||
      stylesheet.background,
    color: theme.button.active.textColor || stylesheet.textActive || stylesheet.text,
    border: css.border(
      1,
      css.border.solid,
      theme.button.active.borderColor || stylesheet.borderActive || stylesheet.border,
    ),
  };

  let disabledColors = {
    background: theme.button.disabled.backgroundColor ||
      stylesheet.backgroundDisabled ||
      stylesheet.background,
    color: theme.button.disabled.textColor || stylesheet.textDisabled || stylesheet.text,
    border: css.border(
      1,
      css.border.solid,
      theme.button.disabled.borderColor || stylesheet.borderDisabled || stylesheet.border,
    ),
  };

  let IconWrapper = style(StylesheetBase.IconWrapper, {
    base: {
      position: 'relative',
      top: -1,
    },
  });

  let Root = style(StylesheetBase.Root, {
    base: {
      position: 'relative',
      textAlign: 'center',
      borderRadius: borderRadius,
      ...colors,
      focus: {
        ...focusColors,
        zIndex: 1,
        outline: css.none,
        textDecoration: css.none,
      },
      hover: {
        ...hoverColors,
        textDecoration: css.none,
      },
      active: {
        ...activeColors,
        hover: {
          ...activeColors,
        },
        focus: {
          ...activeColors,
        },
      },
      disabled: {
        ...disabledColors,
        cursor: 'not-allowed',
        boxShadow: css.none,
        hover: {
          ...disabledColors,
          boxShadow: css.none,
        },
        focus: {
          ...disabledColors,
          boxShadow: css.none,
        },
        active: {
          ...disabledColors,
          boxShadow: css.none,
        },
      },
    },
    xSmall: {
      height: height.xSmall,
      width: width.xSmall,
      lineHeight: 1.2,
      padding: css.padding(2, 6),
      fontWeight: stylesheet.textWidth,
      fontSize: typeof textSize === 'string' ? textSize : textSize.xSmall,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 1, 1, 0, stylesheet.shadow),
      ),
      hover: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowHover),
          css.boxShadow(0, 1, 1, 0, stylesheet.shadowHover),
        ),
      },
      focus: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowFocus),
          shadowFocusRing,
        ),
      },
      active: {
        boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        hover: {
          boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        },
        focus: {
          boxShadow: css.multi(
            css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
            shadowFocusRing,
          ),
        },
      },
      disabled: {
        padding: css.padding(2, 6),
      },
    },

    small: {
      height: height.small,
      width: width.small,
      lineHeight: 1.2,
      padding: css.padding(4, 10),
      fontWeight: stylesheet.textWidth,
      fontSize: typeof textSize === 'string' ? textSize : textSize.small,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 1, 1, 0, stylesheet.shadow),
      ),
      hover: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowHover),
          css.boxShadow(0, 1, 1, 0, stylesheet.shadowHover),
        ),
      },
      focus: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowFocus),
          shadowFocusRing,
        ),
      },
      active: {
        boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 6 : 4,
        paddingBottom: stylesheet.raised ? 2 : 4,
        hover: {
          boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        },
        focus: {
          boxShadow: css.multi(
            css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
            shadowFocusRing,
          ),
        },
      },
      disabled: {
        padding: css.padding(4, 10),
      },
    },

    normal: {
      height: height.normal,
      width: width.normal,
      padding: css.padding(8, 15),
      fontWeight: stylesheet.textWidth,
      fontSize: typeof textSize === 'string' ? textSize : textSize.normal,
      lineHeight: 1.3,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 1, 1, 0, stylesheet.shadow),
      ),
      hover: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowHover),
          css.boxShadow(0, 1, 1, 0, stylesheet.shadowHover),
        ),
      },
      focus: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowFocus),
          shadowFocusRing,
        ),
      },
      active: {
        boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 10 : 8,
        paddingBottom: stylesheet.raised ? 6 : 8,
        hover: {
          boxShadow: css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        },
        focus: {
          boxShadow: css.multi(
            css.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
            shadowFocusRing,
          ),
        },
      },
      disabled: {
        padding: css.padding(8, 15),
      },
    },

    large: {
      height: height.large,
      width: width.large,
      padding: css.padding(10, 30),
      fontWeight: stylesheet.textWidth,
      fontSize: typeof textSize === 'string' ? textSize : textSize.large,
      lineHeight: 1.3,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 2, 3, 0, stylesheet.shadow),
      ),
      hover: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowHover),
          css.boxShadow(0, 2, 3, 0, stylesheet.shadowHover),
        ),
      },
      focus: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowFocus),
          shadowFocusRing,
        ),
      },
      active: {
        boxShadow: css.insetBoxShadow(0, 3, 3, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 12 : 10,
        paddingBottom: stylesheet.raised ? 8 : 10,
        hover: {
          boxShadow: css.insetBoxShadow(0, 3, 3, 0, stylesheet.shadowActive),
        },
        focus: {
          boxShadow: css.multi(
            css.insetBoxShadow(0, 3, 3, 0, stylesheet.shadowActive),
            shadowFocusRing,
          ),
        },
      },
      disabled: {
        padding: css.padding(10, 30),
      },
    },

    groupHorizontally_ltr: {
      borderRadius: 0,

      // reset borderLeft
      borderLeft: noBorder,
      hover: {borderLeft: noBorder},
      focus: {borderLeft: noBorder},
      active: {borderLeft: noBorder},
      disabled: {borderLeft: noBorder},

      firstChild: {
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,

        // restore borderLeft
        borderLeft: colors.border,
        hover: {borderLeft: hoverColors.border},
        focus: {borderLeft: focusColors.border},
        active: {borderLeft: activeColors.border},
        disabled: {borderLeft: disabledColors.border},
      },

      lastChild: {
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
      },
    },

    groupHorizontally_rtl: {
      borderRadius: 0,

      // reset borderRight
      borderRight: noBorder,
      hover: {borderRight: noBorder},
      focus: {borderRight: noBorder},
      active: {borderRight: noBorder},
      disabled: {borderRight: noBorder},

      firstChild: {
        borderTopRightRadius: borderRadius,
        borderBottomRightRadius: borderRadius,

        // restore borderRight
        borderRight: colors.border,
        hover: {borderRight: hoverColors.border},
        focus: {borderRight: focusColors.border},
        active: {borderRight: activeColors.border},
        disabled: {borderRight: disabledColors.border},
      },

      lastChild: {
        borderTopLeftRadius: borderRadius,
        borderBottomLeftRadius: borderRadius,
      },
    },

    groupVertically: {
      borderRadius: 0,

      // reset borderTop
      borderTop: noBorder,
      hover: {borderTop: noBorder},
      focus: {borderTop: noBorder},
      active: {borderTop: noBorder},
      disabled: {borderTop: noBorder},

      firstChild: {
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,

        // restore borderTop
        borderTop: colors.border,
        hover: {borderTop: hoverColors.border},
        focus: {borderTop: focusColors.border},
        active: {borderTop: activeColors.border},
        disabled: {borderTop: disabledColors.border},
      },

      lastChild: {
        borderBottomLeftRadius: borderRadius,
        borderBottomRightRadius: borderRadius,
      },
    },
  });

  return {
    ...StylesheetBase,

    Root,
    IconWrapper,
  };
}
