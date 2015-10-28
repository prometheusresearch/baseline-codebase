/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import * as Stylesheet      from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}         from 'rex-widget/lib/Layout';
import * as Entity          from '../Entity';

@Stylesheet.styleable
export default class Title extends React.Component {

  static stylesheet = Stylesheet.createStylesheet({
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
    let {entity, context, title} = this.props;
    let {Primary, Secondary} = this.stylesheet;
    if (entity.name in context) {
      let entityTitle = Entity.getEntityTitle(context[entity.name]);
      if (entityTitle === null) {
        entityTitle = context[entity.name].id;
      }
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

