/**
 * @copyright 2015, Prometheus Research, LLC
 */


import ButtonBase   from './ButtonBase';
import * as Stylesheet from 'rex-widget/stylesheet';
import * as Style   from 'rex-widget/lib/StyleUtils';
import WidgetTheme  from 'rex-widget/lib/Theme';
import * as Theme   from './Theme';

let colors = {
  background: (
    WidgetTheme.successButton.backgroundColor ||
    Theme.color.success.background

  ),
  color: (
    WidgetTheme.successButton.textColor ||
    Theme.color.success.text
  ),
  borderColor: (
    WidgetTheme.successButton.borderColor ||
    Theme.color.success.border
  ),
};

let hoverColors = {
  background: (
    WidgetTheme.successButton.hover.backgroundColor ||
    Theme.color.success.backgroundHover
  ),
  color: (
    WidgetTheme.successButton.hover.textColor ||
    Theme.color.success.textHover
  ),
  borderColor: (
    WidgetTheme.successButton.hover.borderColor ||
    Theme.color.success.border
  ),
};

let activeColors = {
  background: (
    WidgetTheme.successButton.active.backgroundColor ||
    Theme.color.success.backgroundActive
  ),
  color: (
    WidgetTheme.successButton.active.textColor ||
    Theme.color.success.textActive
  ),
  borderColor: (
    WidgetTheme.successButton.active.borderColor ||
    Theme.color.success.border
  ),
};

export default Stylesheet.style(ButtonBase, {
  Root: {
    borderWidth: 1,
    borderStyle: Style.borderStyle.solid,
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


