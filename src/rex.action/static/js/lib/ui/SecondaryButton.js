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
    background: Theme.color.secondary.background,
    color: Theme.color.secondary.text,

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
