/**
 * @copyright 2015, Prometheus Research, LLC
 */


import ButtonBase from './ButtonBase';
import * as Style from 'rex-widget/lib/StyleUtils';
import * as Theme from './Theme';

let colors = {
  background: Theme.color.success.background,
  color: Theme.color.success.text,
};

let hoverColors = {
  background: Theme.color.success.backgroundHover,
  color: Theme.color.success.textHover,
};

let activeColors = {
  background: Theme.color.success.backgroundActive,
  color: Theme.color.success.textActive,
};

export default ButtonBase.style({
  Root: {
    border: Style.border(1, Theme.color.success.border),
    cursor: Style.cursor.pointer,
    padding: Style.padding(Theme.margin.medium, Theme.margin.large),
    textAlign: Style.textAlign.left,
    fontSize: Theme.fontSize.element.normal,
    fontWeight: Style.fontWeight.bold,
    userSelect: Style.none,
    WebkitUserSelect: Style.none,
    boxShadow: Theme.shadow.light(Theme.color.success.shadow),
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
      boxShadow: Theme.shadow.deepInset(Theme.color.success.shadow),
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


