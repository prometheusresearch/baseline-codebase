/**
 * @copyright 2015, Prometheus Research, LLC
 */


import * as CSS from '../../css';
import * as Stylesheet from '../../stylesheet';
import * as Theme from '../Theme';
import ButtonBase from './base/ButtonBase';

let defaultTextSize = {
  small: '85%',
  normal: '90%',
  large: '100%',
};

let defaultHeight = {
  small: undefined,
  normal: undefined,
  large: undefined,
};

let defaultWidth = {
  small: undefined,
  normal: undefined,
  large: undefined,
};

let stylesheet = {
  raised: true,

  textWidth: 400,
  textSize: defaultTextSize,

  text: CSS.rgb(130),
  textHover: CSS.rgb(100),
  textFocus: CSS.rgb(100),
  textActive: CSS.rgb(100),
  textDisabled: '#dadada',

  background: CSS.rgb(255),
  backgroundHover: CSS.rgb(241),
  backgroundFocus: CSS.rgb(255),
  backgroundActive: CSS.rgb(241),
  backgroundDisabled: CSS.rgb(255),

  border: CSS.rgb(180),
  borderHover: CSS.rgb(180),
  borderFocus: CSS.rgb(180),
  borderActive: CSS.rgb(200),
  borderDisabled: '#ececec',

  shadow: '#b7b7b7',
  shadowHover: '#b7b7b7',
  shadowFocus: '#b7b7b7',
  shadowActive: '#ddd',
  shadowDisabled: '#ddd',
};

function makeStylesheet(stylesheet) {

  let {
    textSize = defaultTextSize,
    height = defaultHeight,
    width = defaultWidth,
  } = stylesheet;

  let buttonSize = {
    small: {
      height: height.small,
      width: width.small,
      padding: CSS.padding(4, 10),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.small || textSize,
      boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadow),
      focus: {
        boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadowFocus),
      },
      hover: {
        boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadowHover),
      },
      active: {
        boxShadow: CSS.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 6 : 4,
        paddingBottom: stylesheet.raised ? 2 : 4,
      },
      disabled: {
        padding: CSS.padding(4, 10),
      }
    },

    normal: {
      height: height.normal,
      width: width.normal,
      padding: CSS.padding(8, 15),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.normal || textSize,
      boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadow),
      focus: {
        boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadowFocus),
      },
      hover: {
        boxShadow: CSS.boxShadow(0, 1, 1, 0, stylesheet.shadowHover),
      },
      active: {
        boxShadow: CSS.insetBoxShadow(0, 1, 1, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 10 : 8,
        paddingBottom: stylesheet.raised ? 6 : 8,
      },
      disabled: {
        padding: CSS.padding(8, 15),
      }
    },

    large: {
      height: height.large,
      width: width.large,
      padding: CSS.padding(10, 30),
      fontWeight: stylesheet.textWidth,
      fontSize: textSize.large || textSize,
      boxShadow: CSS.boxShadow(0, 2, 3, 0, stylesheet.shadow),
      focus: {
        boxShadow: CSS.boxShadow(0, 2, 3, 0, stylesheet.shadowFocus),
      },
      hover: {
        boxShadow: CSS.boxShadow(0, 2, 3, 0, stylesheet.shadowHover),
      },
      active: {
        boxShadow: CSS.insetBoxShadow(0, 2, 3, 0, stylesheet.shadowActive),
        paddingTop: stylesheet.raised ? 12 : 10,
        paddingBottom: stylesheet.raised ? 8 : 10,
      },
      disabled: {
        padding: CSS.padding(10, 30),
      }
    },
  };

  let colors = {
    background: Theme.button.backgroundColor || stylesheet.background,
    color: Theme.button.textColor || stylesheet.text,
    border: CSS.border(1, CSS.border.solid, Theme.button.borderColor || stylesheet.border),
  };

  let hoverColors = {
    background: Theme.button.hover.backgroundColor || stylesheet.backgroundHover,
    color: Theme.button.hover.textColor || stylesheet.textHover,
    border: CSS.border(1, CSS.border.solid, Theme.button.hover.borderColor || stylesheet.borderHover),
  };

  let focusColors = {
    background: Theme.button.focus.backgroundColor || stylesheet.backgroundFocus,
    color: Theme.button.focus.textColor || stylesheet.textFocus,
    border: CSS.border(1, CSS.border.solid, Theme.button.focus.borderColor || stylesheet.borderFocus),
  };

  let activeColors = {
    background: Theme.button.active.backgroundColor || stylesheet.backgroundActive,
    color: Theme.button.active.textColor || stylesheet.textActive,
    border: CSS.border(1, CSS.border.solid, Theme.button.active.borderColor || stylesheet.borderActive),
  };

  let disabledColors = {
    background: Theme.button.disabled.backgroundColor || stylesheet.backgroundDisabled,
    color: Theme.button.disabled.textColor || stylesheet.textDisabled,
    border: CSS.border(1, CSS.border.solid, Theme.button.disabled.borderColor || stylesheet.borderDisabled),
  };

  return {
    Root: {
      position: 'relative',
      textAlign: 'center',
      ...colors,
      focus: {
        ...focusColors,
        outline: CSS.none,
        textDecoration: CSS.none,
      },
      hover: {
        ...hoverColors,
        textDecoration: CSS.none,
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
        boxShadow: CSS.none,
        hover: {
          ...disabledColors,
          boxShadow: CSS.none,
        },
        focus: {
          ...disabledColors,
          boxShadow: CSS.none,
        },
        active: {
          ...disabledColors,
          boxShadow: CSS.none,
        }
      },
      attachLeft: {
        borderLeft: CSS.none,
        hover: {
          borderLeft: CSS.none,
        },
        focus: {
          borderLeft: CSS.none,
        },
        active: {
          borderLeft: CSS.none,
        },
        disabled: {
          borderLeft: CSS.none,
        },
      },
      attachRight: {
        borderRight: CSS.none,
        hover: {
          borderRight: CSS.none,
        },
        focus: {
          borderRight: CSS.none,
        },
        active: {
          borderRight: CSS.none,
        },
        disabled: {
          borderRight: CSS.none,
        },
      },
      attachTop: {
        borderTop: CSS.none,
        hover: {
          borderTop: CSS.none,
        },
        focus: {
          borderTop: CSS.none,
        },
        active: {
          borderTop: CSS.none,
        },
        disabled: {
          borderTop: CSS.none,
        },
      },
      attachBottom: {
        borderBottom: CSS.none,
        hover: {
          borderBottom: CSS.none,
        },
        focus: {
          borderBottom: CSS.none,
        },
        active: {
          borderBottom: CSS.none,
        },
        disabled: {
          borderBottom: CSS.none,
        },
      },

      groupHorizontally: {
        borderRight: CSS.none,
        hover: {
          borderRight: CSS.none,
        },
        focus: {
          borderRight: CSS.none,
        },
        active: {
          borderRight: CSS.none,
        },
        disabled: {
          borderRight: CSS.none,
        },
        lastChild: {
          borderRight: CSS.border(1, stylesheet.border),
          hover: {
            borderRight: CSS.border(1, stylesheet.borderHover),
          },
          focus: {
            borderRight: CSS.border(1, stylesheet.borderFocus),
          },
          active: {
            borderRight: CSS.border(1, stylesheet.borderActive),
          },
          disabled: {
            borderRight: CSS.border(1, stylesheet.borderDisabled),
          }
        }
      },
      groupVertically: {
        firstChild: {
          borderBottom: CSS.none,
        },
        lastChild: {
          borderTop: CSS.none,
        }
      },
    },

    IconWrapper: {
      position: 'relative',
      top: -1,
      hasCaption: {
        marginRight: 10,
      }
    }
  };
}

let Button = Stylesheet.style(
  ButtonBase,
  makeStylesheet(stylesheet),
  {displayName: 'Button'}
);

Button.style = function style(stylesheet, options) {
  return Stylesheet.style(ButtonBase, makeStylesheet(stylesheet), options);
};

export default Button;
