/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as css from 'rex-widget/CSS';

export let color = {
  shadowLight: css.rgb(150),

  primary: {
    text: css.rgb(136),
    textHover: css.rgb(68),
    textActive: css.rgb(68),

    background: css.rgb(255),
    backgroundHover: css.rgb(241),
    backgroundActive: css.rgb(241),

    border: css.rgb(241),
  },

  secondary: {
    text: css.rgb(136),
    textHover: css.rgb(68),
    textActive: css.rgb(241),

    background: css.rgb(250),
    backgroundHover: css.rgb(241),
    backgroundActive: css.rgb(177)
  },

  success: {
    text: css.rgb(255),
    textHover: css.rgb(250),
    textActive: css.rgb(250),

    background: css.rgb(92, 184, 92),
    backgroundHover: css.rgb(81, 164, 81),
    backgroundActive: css.rgb(81, 164, 81),

    border: css.rgb(76, 174, 76),
    shadow: css.rgb(57, 114, 57),
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
    return css.boxShadow(0, 0, 1, 0, shadowColor);
  },

  normal(shadowColor = color.shadowLight) {
    return css.boxShadow(0, 0, 2, 0, shadowColor);
  },
};

export let buttonSize = {
  normal: {
    padding: css.padding(margin.medium, margin.large),
    fontWeight: css.fontWeight.bold,
    fontSize: fontSize.element.normal,
  },

  small: {
    padding: css.padding(margin.small, margin.medium),
    fontWeight: css.fontWeight.bold,
    fontSize: fontSize.element.small,
  },

  large: {
    padding: css.padding(margin.large, margin.large * 2),
    fontWeight: css.fontWeight.bold,
    fontSize: fontSize.element.large,
  },
};
