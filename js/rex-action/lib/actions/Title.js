/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import {Element} from 'react-stylesheet';

import * as Entity from '../model/Entity';

export function TitleBase({title, subtitle}: {title: string, subtitle?: ?string}) {
  if (subtitle != null) {
    return (
      <Element>
        <Element>{title}</Element>
        <Element opacity={0.7} fontSize="90%">{subtitle}</Element>
      </Element>
    );
  } else {
    return <Element display="inline">{title}</Element>;
  }
}

export default class Title extends React.Component {
  props: {
    entity: {name: string},
    context: Object,
    title: string,
  };

  render() {
    const {entity, context, title} = this.props;
    const subtitle = getEntityTitle(context, entity.name);
    return <TitleBase title={title} subtitle={subtitle} />;
  }
}

function getEntityTitle(context, entityName): ?string {
  if (entityName in context && context[entityName] != null) {
    let subtitle = Entity.getEntityTitle(context[entityName]);
    if (subtitle === null) {
      subtitle = context[entityName].id;
    }
    return subtitle;
  } else {
    return null;
  }
}
