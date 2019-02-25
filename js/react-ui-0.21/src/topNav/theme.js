/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import {css, color} from '../stylesheet';
import {brandColors} from '../theme';

function makeTheme({primaryColor, secondaryColor}) {

  primaryColor = color(primaryColor);
  secondaryColor = color(secondaryColor);

  let header = {
    height: 50,
    background: primaryColor.toCSS(),
    text: '#FFFFFF',
    boxShadow: css.boxShadow(0, 1, 0, 0, primaryColor.darkenByRatio(0.2).toCSS()),
    hover: {
      background: primaryColor.lightenByRatio(0.2).saturateByRatio(0.3).toCSS()
    }
  };

  let headerMenu = {
    background: header.hover.background,
    hover: {
      background: primaryColor.lightenByRatio(0.4).saturateByRatio(0.3).toCSS()
    }
  };

  let subHeader = {
    height: 40,
    background: secondaryColor.toCSS(),
    text: '#FFFFFF',
    boxShadow: css.boxShadow(0, 1, 0, 0, secondaryColor.darkenByRatio(0.2).toCSS()),
    hover: {
      background: radialGradient(
        'ellipse at 50% 55%',
        `${secondaryColor.lightenByRatio(0.6).toCSS()} 0%`,
        `${secondaryColor.toCSS()} 70%`
      )
    },
  };

  return {header, headerMenu, subHeader};
}

export default makeTheme({
  primaryColor: brandColors.primary,
  secondaryColor: brandColors.secondary,
});

// TODO: Move to it CSS helpers
function radialGradient(...stops) {
  return `radial-gradient(${stops.join(', ')})`;
}
