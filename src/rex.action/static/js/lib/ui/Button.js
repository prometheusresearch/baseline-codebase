/**
 * @copyright 2015, Prometheus Research, LLC
 */


import ButtonBase   from './ButtonBase';
import * as Style   from 'rex-widget/lib/StyleUtils';
import WidgetTheme  from 'rex-widget/lib/Theme';
import * as Theme   from './Theme';

let colors = {
  background: (
    WidgetTheme.button.backgroundColor ||
    Theme.color.primary.background
  ),
  color: (
    WidgetTheme.button.textColor ||
    Theme.color.primary.text
  ),
  borderColor: (
    WidgetTheme.button.borderColor ||
    Theme.color.primary.border
  ),
};

let hoverColors = {
  background: (
    WidgetTheme.button.hover.backgroundColor ||
    Theme.color.primary.backgroundHover
  ),
  color: (
    WidgetTheme.button.hover.textColor ||
    Theme.color.primary.textHover
  ),
  borderColor: (
    WidgetTheme.button.hover.borderColor ||
    Theme.color.primary.border
  ),
};

let activeColors = {
  background: (
    WidgetTheme.button.active.backgroundColor ||
    Theme.color.primary.backgroundActive
  ),
  color: (
    WidgetTheme.button.active.textColor ||
    Theme.color.primary.textActive
  ),
  borderColor: (
    WidgetTheme.button.active.borderColor ||
    Theme.color.primary.border
  ),
};

export default ButtonBase.style({
  Root: {
    borderWidth: 1,
    borderStyle: Style.borderStyle.solid,
    boxShadow: Theme.shadow.light(),
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

  IconWrapper: {
    hasCaption: {
      marginRight: Theme.margin.medium
    }
  }
});

