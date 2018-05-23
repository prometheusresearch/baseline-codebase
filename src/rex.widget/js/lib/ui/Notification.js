/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {boxShadow, rgba} from '../../css';
import {VBox, HBox} from '../../layout';
import Icon from './Icon';

let NotificationStyle = {
  self: {
    fontSize: '90%',
    padding: '15px',
    marginBottom: '20px',
    border: '1px solid transparent',
    borderRadius: '2px',
    boxShadow: boxShadow(0, 6, 12, 0, rgba(0, 0, 0, 0.05)),

    color: '#888',
    backgroundColor: '#eee',
    borderColor: '#eaeaea'
  },
  icon: {
    marginRight: '10px',
    textAlign: 'center'
  },
  success: {
    color: '#3c763d',
    backgroundColor: '#dff0d8',
    borderColor: '#d6e9c6'
  },
  danger: {
    color: '#a94442',
    backgroundColor: '#f2dede',
    borderColor: '#ebccd1'
  },
  info: {
    color: '#31708f',
    backgroundColor: '#d9edf7',
    borderColor: '#bce8f1'
  },
  warning: {
    color: '#8a6d3b',
    backgroundColor: '#fcf8e3',
    borderColor: '#faebcc'
  }
};

/**
 * Renders children xor text, using the NotificationStyle.
 * This content is optionally preceeded by an icon.
 * The notification is removed after **ttl** seconds.
 *
 * @public
 */
export default class Notification extends React.Component {

  static propTypes = {
    /**
     * If ``this.props`` has children, they will be rendered.
     */
    children: React.PropTypes.element,

    /**
     * If ``this.props`` has no children, this text will be rendered.
     */
    text: React.PropTypes.string,

    /**
     * The name of the icon to render.
     */
    icon: React.PropTypes.string,

    /**
     * Selects the css style.
     * The string is the name of a set of css settings.
     * Otherwise the object is used.
     * Naturally it must have only valid css attributes.
     */
    kind: React.PropTypes.oneOfType([
      React.PropTypes.oneOf([
        'self',
        'icon',
        'success',
        'danger',
        'info',
        'warning'
      ]),
      React.PropTypes.object
    ]),

    /**
     * Additional css settings to use.
     * The object must have only valid css attributes.
     */
    style: React.PropTypes.object,

    /**
     * The number of seconds until the notification is removed.
     * Set **ttl** to ``Infinity`` for no removal.
     */
    ttl: React.PropTypes.number
  };

  render() {
    let {children, text, icon, kind, style, ...props} = this.props;
    style = {
      ...NotificationStyle.self,
      ...(typeof kind === 'string' ? NotificationStyle[kind] : kind),
      ...style
    };
    return (
      <div {...props} style={style} id={undefined}>
        <HBox>
          {icon &&
            <VBox style={NotificationStyle.icon} flex={1}>
              <Icon name={icon} />
            </VBox>}
          <VBox flex={10}>
            {children || text}
          </VBox>
        </HBox>
      </div>
    );
  }
}
