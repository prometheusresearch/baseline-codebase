/**
 * @copyright 2015, Prometheus Research, LLC
 */


import ButtonBase from './ButtonBase';
import * as Style from 'rex-widget/lib/StyleUtils';
import * as Theme from './Theme';

let hoverColors = {
  background: Theme.color.secondary.backgroundHover,
  color: Theme.color.secondary.textHover,
};

let activeColors = {
  background: Theme.color.secondary.backgroundActive,
  color: Theme.color.secondary.textActive,
};

export default ButtonBase.style({
  Root: {
    border: Style.none,
    cursor: Style.cursor.pointer,
    background: Theme.color.secondary.background,
    textAlign: Style.textAlign.left,
    color: Theme.color.secondary.text,
    userSelect: Style.none,
    WebkitUserSelect: Style.none,

    ...Theme.buttonSize,

    hover: {
      ...hoverColors,
      textDecoration: Style.none,
    },
    focus: {
      ...hoverColors,
      outline: Style.none,
      textDecoration: Style.none,
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
  },

  Icon: {
    hasCaption: {
      marginRight: Theme.margin.medium
    }
  }
});
