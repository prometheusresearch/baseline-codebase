/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { Element } from "react-stylesheet";
import * as mui from "@material-ui/core";

import * as Entity from "../model/Entity";

export function TitleBase({
  title,
  subtitle
}: {|
  title: string,
  subtitle?: ?string
|}) {
  if (subtitle != null) {
    return (
      <Element>
        <mui.Typography variant="inherit" noWrap display="block" title={title}>
          {title}
        </mui.Typography>
        <mui.Typography
          display="block"
          variant="inherit"
          noWrap
          title={subtitle}
          style={{ fontSize: "90%", opacity: 0.7 }}
        >
          {subtitle}
        </mui.Typography>
      </Element>
    );
  } else {
    return (
      <Element>
        <mui.Typography variant="inherit" noWrap title={title}>
          {title}
        </mui.Typography>
      </Element>
    );
  }
}

export function Title(props: {
  entity: { name: string },
  context: Object,
  title: string
}) {
  const { entity, context, title } = props;
  const subtitle = getEntityTitle(context, entity.name);
  return <TitleBase title={title} subtitle={subtitle} />;
}

export default Title;

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
