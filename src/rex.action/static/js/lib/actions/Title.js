/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import Stylesheet           from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}         from 'rex-widget/lib/Layout';
import {getEntityTitle}     from '../Entity';

@Stylesheet
export default class Title extends React.Component {

  static stylesheet = {
    Primary: {
      Component: VBox,
    },
    Secondary: {
      Component: VBox,
      opacity: 0.7,
      fontSize: '90%',
    },
  };

  render() {
    let {entity, context, title} = this.props;
    let {Primary, Secondary} = this.stylesheet;
    if (entity.name in context) {
      let entityTitle = getEntityTitle(context[entity.name]);
      return (
        <VBox>
          <Primary>{title}</Primary>
          <Secondary>{entityTitle}</Secondary>
        </VBox>
      );
    } else {
      return <Primary>{title}</Primary>;
    }
  }
}

