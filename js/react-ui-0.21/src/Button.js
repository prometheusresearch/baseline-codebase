/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {style, css}  from './stylesheet';
import theme from './theme';

import ButtonBase from './ButtonBase';

let defaultTextSize = {
  'x-small': 10,
  small: 12,
  normal: 14,
  large: 16,
};

let defaultBorderRadius = 2;

let defaultHeight = {
  'x-small': undefined,
  small: undefined,
  normal: undefined,
  large: undefined,
};

let defaultWidth = {
  'x-small': undefined,
  small: undefined,
  normal: undefined,
  large: undefined,
};

let stylesheet = {
  raised: true,

  textWidth: 300,
  textSize: defaultTextSize,

  text: css.rgb(130),
  textHover: css.rgb(100),
  textFocus: css.rgb(100),
  textActive: css.rgb(140),
  textDisabled: '#dadada',

  background: css.rgb(255),
  backgroundHover: css.rgb(241),
  backgroundFocus: css.rgb(255),
  backgroundActive: css.rgb(231),
  backgroundDisabled: css.rgb(251),

  border: css.rgb(180),
  borderHover: css.rgb(180),
  borderFocus: css.rgb(180),
  borderActive: css.rgb(200),
  borderDisabled: css.rgb(180),

  shadow: '#b7b7b7',
  shadowHover: '#b7b7b7',
  shadowFocus: '#b7b7b7',
  shadowActive: css.rgb(210),
  shadowDisabled: '#ddd',

  shadowFocusRing: css.boxShadow(0, 0, 0, 2, css.rgba(0, 126, 229, 0.5)),
};

function makeStylesheet(stylesheet) {

  let {
    textSize = defaultTextSize,
    height = defaultHeight,
    width = defaultWidth,
    borderRadius = defaultBorderRadius,
  } = stylesheet;

  let buttonSize = {

    'x-small': {
      height: height['x-small'],
      width: width['x-small'],
      lineHeight: 1.2,
      padding: css.padding(2, 6),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize['x-small'] || textSize,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 1, 1, 0, stylesheet.shadow)
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
          stylesheet.shadowFocusRing,
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
            stylesheet.shadowFocusRing,
          ),
        }
      },
      disabled: {
        padding: css.padding(2, 6),
      }
    },

    small: {
      height: height.small,
      width: width.small,
      lineHeight: 1.2,
      padding: css.padding(4, 10),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.small || textSize,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 1, 1, 0, stylesheet.shadow)
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
          stylesheet.shadowFocusRing,
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
            stylesheet.shadowFocusRing,
          ),
        }
      },
      disabled: {
        padding: css.padding(4, 10),
      }
    },

    normal: {
      height: height.normal,
      width: width.normal,
      padding: css.padding(8, 15),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.normal || textSize,
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
          stylesheet.shadowFocusRing,
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
            stylesheet.shadowFocusRing,
          ),
        }
      },
      disabled: {
        padding: css.padding(8, 15),
      }
    },

    large: {
      height: height.large,
      width: width.large,
      padding: css.padding(10, 30),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.large || textSize,
      lineHeight: 1.3,
      boxShadow: css.multi(
        css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadow),
        css.boxShadow(0, 2, 3, 0, stylesheet.shadow),
      ),
      hover: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowHover),
          css.boxShadow(0, 2, 3, 0, stylesheet.shadowHover),
        )
      },
      focus: {
        boxShadow: css.multi(
          css.insetBoxShadow(0, -2, 9, -4, stylesheet.shadowFocus),
          stylesheet.shadowFocusRing,
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
            stylesheet.shadowFocusRing,
          ),
        }
      },
      disabled: {
        padding: css.padding(10, 30),
      }
    },
  };

  let colors = {
    background: (
      theme.button.backgroundColor ||
      stylesheet.background
    ),
    color: (
      theme.button.textColor ||
      stylesheet.text
    ),
    border: css.border(
      1, css.border.solid,
      theme.button.borderColor ||
      stylesheet.border
    ),
  };

  let hoverColors = {
    background: (
      theme.button.hover.backgroundColor ||
      stylesheet.backgroundHover ||
      stylesheet.background
    ),
    color: (
      theme.button.hover.textColor ||
      stylesheet.textHover ||
      stylesheet.text
    ),
    border: css.border(
      1, css.border.solid,
      theme.button.hover.borderColor ||
      stylesheet.borderHover ||
      stylesheet.border
    ),
  };

  let focusColors = {
    background: (
      theme.button.focus.backgroundColor ||
      stylesheet.backgroundFocus ||
      stylesheet.background
    ),
    color: (
      theme.button.focus.textColor ||
      stylesheet.textFocus ||
      stylesheet.text
    ),
    border: css.border(
      1, css.border.solid,
      theme.button.focus.borderColor ||
      stylesheet.borderFocus ||
      stylesheet.border
    ),
  };

  let activeColors = {
    background: (
      theme.button.active.backgroundColor ||
      stylesheet.backgroundActive ||
      stylesheet.background
    ),
    color: (
      theme.button.active.textColor ||
      stylesheet.textActive ||
      stylesheet.text
    ),
    border: css.border(
      1, css.border.solid,
      theme.button.active.borderColor ||
      stylesheet.borderActive ||
      stylesheet.border
    ),
  };

  let disabledColors = {
    background: (
      theme.button.disabled.backgroundColor ||
      stylesheet.backgroundDisabled ||
      stylesheet.background
    ),
    color: (
      theme.button.disabled.textColor ||
      stylesheet.textDisabled ||
      stylesheet.text
    ),
    border: css.border(
      1, css.border.solid,
      theme.button.disabled.borderColor ||
      stylesheet.borderDisabled ||
      stylesheet.border
    ),
  };

  return {
    Root: {
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
      ...buttonSize,
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
        }
      },

      groupHorizontally: {
        ltr: {
          borderRight: 'none !important',
          borderRadius: 0,
          firstChild: {
            borderBottomLeftRadius: borderRadius,
            borderTopLeftRadius: borderRadius,
            borderRight: 'none !important',
          },
          lastChild: {
            borderBottomRightRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            hover: {
              borderRight: css.border(1, stylesheet.borderHover) + ' !important',
            },
            focus: {
              borderRight: css.border(1, stylesheet.borderFocus) + ' !important',
            },
            active: {
              borderRight: css.border(1, stylesheet.borderActive) + ' !important',
            },
            disabled: {
              borderRight: css.border(1, stylesheet.borderDisabled) + ' !important',
            },
            borderRight: css.border(1, stylesheet.border) + ' !important',
          }
        },
        rtl: {
          borderLeft: 'none !important',
          borderRadius: 0,
          firstChild: {
            borderBottomRightRadius: borderRadius,
            borderTopRightRadius: borderRadius,
            borderLeft: 'none !important',
          },
          lastChild: {
            borderBottomLeftRadius: borderRadius,
            borderTopLeftRadius: borderRadius,
            hover: {
              borderLeft: css.border(1, stylesheet.borderHover) + ' !important',
            },
            focus: {
              borderLeft: css.border(1, stylesheet.borderFocus) + ' !important',
            },
            active: {
              borderLeft: css.border(1, stylesheet.borderActive) + ' !important',
            },
            disabled: {
              borderLeft: css.border(1, stylesheet.borderDisabled) + ' !important',
            },
            borderLeft: css.border(1, stylesheet.border) + ' !important',
          }
        }
      },
      groupVertically: {
        firstChild: {
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottom: css.none,
        },
        lastChild: {
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderTop: css.none,
        }
      },
      attachLeft: {
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderLeft: css.none,
        hover: {
          borderLeft: css.none,
        },
        focus: {
          borderLeft: css.none,
        },
        active: {
          borderLeft: css.none,
          hover: {
            borderLeft: css.none,
          },
          focus: {
            borderLeft: css.none,
          }
        },
        disabled: {
          borderLeft: css.none,
        },
      },
      attachRight: {
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
        borderRight: css.none,
        hover: {borderRight: css.none},
        focus: {borderRight: css.none},
        active: {
          borderRight: css.none,
          hover: {borderRight: css.none},
          focus: {borderLeft: css.none},
        },
        disabled: {
          borderRight: css.none,
        },
      },
      attachTop: {
        borderTopRightRadius: 0,
        borderTopLeftRadius: 0,
        borderTop: css.none,
        hover: {
          borderTop: css.none,
        },
        focus: {
          borderTop: css.none
        },
        active: {
          borderTop: css.none,
          hover: {borderTop: css.none},
          focus: {borderTop: css.none},
        },
        disabled: {
          borderTop: css.none,
        },
      },
      attachBottom: {
        borderBottomRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottom: css.none,
        hover: {
          borderBottom: css.none,
        },
        focus: {
          borderBottom: css.none,
        },
        active: {
          borderBottom: css.none,
          hover: {borderBottom: css.none},
          focus: {borderBottom: css.none},
        },
        disabled: {
          borderBottom: css.none,
        },
      },
    },

    IconWrapper: {
      position: 'relative',
      top: -1,
      hasCaption: {
        ['x-small']: {
          leftPosition: {
            ltr: {
              marginRight: 4,
              marginLeft: 0,
            },
            rtl: {
              marginRight: 0,
              marginLeft: 4,
            }
          },
          rightPosition: {
            ltr: {
              marginLeft: 4,
              marginRight: 0,
            },
            rtl: {
              marginLeft: 0,
              marginRight: 4,
            }
          }
        },
        small: {
          leftPosition: {
            ltr: {
              marginRight: 4,
              marginLeft: 0,
            },
            rtl: {
              marginRight: 0,
              marginLeft: 4,
            }
          },
          rightPosition: {
            ltr: {
              marginLeft: 4,
              marginRight: 0,
            },
            rtl: {
              marginLeft: 0,
              marginRight: 4,
            }
          }
        },
        normal: {
          leftPosition: {
            ltr: {
              marginLeft: 0,
              marginRight: 8,
            },
            rtl: {
              marginLeft: 8,
              marginRight: 0,
            }
          },
          rightPosition: {
            ltr: {
              marginLeft: 8,
              marginRight: 0,
            },
            rtl: {
              marginLeft: 0,
              marginRight: 8,
            }
          }
        },
        large: {
          leftPosition: {
            ltr: {
              marginLeft: 0,
              marginRight: 10,
            },
            rtl: {
              marginLeft: 10,
              marginRight: 0,
            }
          },
          rightPosition: {
            ltr: {
              marginLeft: 10,
              marginRight: 0,
            },
            rtl: {
              marginLeft: 0,
              marginRight: 10,
            }
          }
        }
      }
    }
  };
}

function makeButton(stylesheet, options) {
  return style(
    ButtonBase,
    makeStylesheet(stylesheet),
    options
  );
}

let Button = makeButton(stylesheet, {displayName: 'Button'});

Button.style = makeButton;

export default Button;
