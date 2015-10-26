/**
 * @copyright 2015, Prometheus Research, LLC
 */

import Style, {boxShadow, insetBoxShadow, rgb} from 'rex-widget/lib/StyleUtils';

export let color = {
  shadowLight: rgb(204),

  primary: {
    text: rgb(136),
    textHover: rgb(68),
    textActive: rgb(68),

    background: rgb(255),
    backgroundHover: rgb(241),
    backgroundActive: rgb(241),

    border: rgb(241),
  },

  secondary: {
    text: rgb(136),
    textHover: rgb(68),
    textActive: rgb(241),

    background: rgb(250),
    backgroundHover: rgb(241),
    backgroundActive: rgb(177)
  },

  success: {
    text: rgb(255),
    textHover: rgb(250),
    textActive: rgb(250),

    background: rgb(92, 184, 92),
    backgroundHover: rgb(81, 164, 81),
    backgroundActive: rgb(81, 164, 81),

    border: rgb(76, 174, 76),
    shadow: rgb(57, 114, 57),
  },
};

export let fontSize = {
  element: {
    small: '80%',
    normal: '85%',
    large: '100%',
  }
};

export let margin = {
  small: 4,
  medium: 8,
  large: 16,
};

export let shadow = {
  light(shadowColor = color.shadowLight) {
    return boxShadow(0, 0, 2, -1, shadowColor);
  },

  normal(shadowColor = color.shadowLight) {
    return boxShadow(0, 0, 5, -1, shadowColor);
  },

  deepInset(shadowColor = color.shadowLight) {
    return insetBoxShadow(0, 0, 10, 0, shadowColor);
  },
};

export let buttonSize = {
  normal: {
    padding: Style.padding(margin.medium, margin.large),
    fontWeight: Style.fontWeight.bold,
    fontSize: fontSize.element.normal,
  },

  small: {
    padding: Style.padding(margin.small, margin.medium),
    fontWeight: Style.fontWeight.bold,
    fontSize: fontSize.element.small,
  },

  large: {
    padding: Style.padding(margin.large, margin.large * 2),
    fontWeight: Style.fontWeight.bold,
    fontSize: fontSize.element.large,
  },
};
