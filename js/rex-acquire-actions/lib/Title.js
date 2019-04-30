/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import * as Stylesheet from 'rex-widget/Stylesheet';
import {VBox} from '@prometheusresearch/react-box';


export default class Title extends React.Component {
  static stylesheet = Stylesheet.create({
    Primary: {
      Component: VBox,
    },

    Secondary: {
      Component: VBox,
      opacity: 0.7,
      fontSize: '90%',
    },
  });

  render() {
    let {title, subtitle} = this.props;
    let {Primary, Secondary} = this.constructor.stylesheet;

    if (subtitle) {
      return (
        <VBox>
          <Primary>{title}</Primary>
          <Secondary>{subtitle}</Secondary>
        </VBox>
      );
    } else {
      return <Primary>{title}</Primary>;
    }
  }
}

