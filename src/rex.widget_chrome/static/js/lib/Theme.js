/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as css from 'rex-widget/css';

export default {
  header: {
    height: 50,
    background: '#4490EF',
    text: '#FFFFFF',
    textShadow: css.textShadow(0, 1, 0, '#2E5E9A'),
    boxShadow: css.boxShadow(0, 1, 0, 0, '#578CCE'),
    hover: {
      background: '#2873D2',
    }
  },
  headerMenu: {
    background: '#2873D2',
    hover: {
      background: '#3E87E4',
    }
  },
  subHeader: {
    height: 30,
    background: '#75B2FF',
    text: '#FFFFFF',
    boxShadow: css.boxShadow(0, 1, 0, 0, '#4490EF'),
    textShadow: css.textShadow(0, 1, 0, '#2E5E9A'),
    hover: {
      background: 'radial-gradient(ellipse at 50% 70%, rgb(192, 221, 255) 0%, rgb(117, 178, 255) 70%)',

    },
  }
};
