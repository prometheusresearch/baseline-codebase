/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as css from 'rex-widget/css';

const companyColors = {
  prometheusDarkBlue: css.color('#004E94'),
  prometheusLighterBlue: css.color('#0094CD'),
};

function makeTheme(params) {
  return {
    header: {
      height: 50,
      background: params.primaryColor.toCSS(),
      text: '#FFFFFF',
      boxShadow: css.boxShadow(0, 1, 0, 0, params.primaryColor.darkenByRatio(0.2).toCSS()),
      textShadow: css.textShadow(0, 1, 0, params.primaryColor.darkenByRatio(0.4).toCSS()),
      hover: {
        background: params.primaryColor.lightenByRatio(0.4).toCSS()
      }
    },
    headerMenu: {
      background: params.primaryColor.lightenByRatio(0.4).toCSS(),
      hover: {
        background: params.primaryColor.lightenByRatio(0.5).toCSS(),
      }
    },
    subHeader: {
      height: 35,
      background: params.secondaryColor.toCSS(),
      text: '#FFFFFF',
      boxShadow: css.boxShadow(0, 1, 0, 0, params.secondaryColor.darkenByRatio(0.2).toCSS()),
      textShadow: css.textShadow(0, 1, 0, params.secondaryColor.darkenByRatio(0.4).toCSS()),
      hover: {
        background: `radial-gradient(ellipse at 50% 55%, ${params.secondaryColor.lightenByRatio(0.6).toCSS()} 0%, ${params.secondaryColor.toCSS()} 70%)`,

      },
    }
  };
}

export default makeTheme({
  primaryColor: companyColors.prometheusDarkBlue,
  secondaryColor: companyColors.prometheusLighterBlue,
});
