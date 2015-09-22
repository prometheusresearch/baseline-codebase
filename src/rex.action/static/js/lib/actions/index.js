/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

export Page     from './Page';
export Pick     from './Pick';
export View     from './View';
export Make     from './Make';
export Drop     from './Drop';
export PickDate from './PickDate';

export function renderTitle(position) {
  let {type, props} = position.element;
  if (type.renderTitle) {
    return type.renderTitle(props, position.context);
  } else {
    return getTitle(position.element);
  }
}

export function getTitle(element) {
  if (element.type.getTitle) {
    return element.type.getTitle(element.props);
  } else if (element.props.title) {
    return element.props.title;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().title;
  } else {
    return '';
  }
}

export function getIcon(element) {
  if (element.type.getIcon) {
    return element.type.getIcon(element.props);
  } else if (element.props.icon) {
    return element.props.icon;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().icon;
  } else {
    return null;
  }
}

export function getWidth(element) {
  if (element.type.getWidth) {
    return element.type.getWidth(element.props);
  } else if (element.props.width) {
    return element.props.width;
  } else if (element.type.getDefaultProps) {
    return element.type.getDefaultProps().width;
  } else {
    return 480;
  }
}
