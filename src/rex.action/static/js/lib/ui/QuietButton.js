/**
 * @copyright 2015, Prometheus Research, LLC
 */


import ButtonBase from './ButtonBase';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as Style from 'rex-widget/lib/StyleUtils';
import * as Theme from './Theme';

let colors = {
  background: Theme.color.primary.background,
  color: Theme.color.primary.text,
};

let hoverColors = {
  background: Theme.color.primary.backgroundHover,
  color: Theme.color.primary.textHover,
};

let activeColors = {
  background: Theme.color.primary.backgroundActive,
  color: Theme.color.primary.textActive,
};

export default Stylesheet.style(ButtonBase, {
  Root: {
    border: Style.none,
    ...colors,
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
      boxShadow: Theme.shadow.deepInset(),
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


