/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ReactDOM from 'react-dom';
import Notification from './Notification';

let _notificationID = 0;

let NotificationLayerStyle = {
  self: {
    position: 'fixed',
    zIndex: 10000,
    top: 0,
    right: 0,
    width: '25%',
    padding: 15,
  },
};

export let NotificationLayer = React.createClass({
  render() {
    let notifications = this.state.notifications.map(notification =>
      React.cloneElement(notification, {
        key: notification.props.id,
        onClick: this.removeNotification.bind(null, notification.props.id),
      }));
    return (
      <div style={NotificationLayerStyle.self}>
        {notifications}
      </div>
    );
  },

  getInitialState() {
    return {
      notifications: [],
    };
  },

  componentDidMount() {
    this._timers = {};
  },

  componentWillUnmount() {
    for (let id in this._timers) {
      if (this._timers.hasOwnProperty(id)) {
        clearTimeout(this._timers[id]);
      }
    }
    delete this._timers;
  },

  showNotification(notification) {
    _notificationID = _notificationID + 1;
    let id = _notificationID;
    this.setState(
      state => {
        let notifications = state.notifications.slice(0);
        notifications.push(React.cloneElement(notification, {id}));
        return {...state, notifications};
      },
      () => {
        if (notification.props.ttl !== Infinity) {
          this._scheduleRemove(id, notification.props.ttl);
        }
      },
    );
    return _notificationID;
  },

  removeNotification(notificationId) {
    this.setState(state => {
      let idx = this._indexOfNotification(notificationId, state.notifications);
      if (idx > -1) {
        let notifications = state.notifications.slice(0);
        notifications.splice(idx, 1);
        return {...state, notifications};
      } else {
        return state;
      }
    });
  },

  _scheduleRemove(notificationId, ttl) {
    if (this._timers[notificationId]) {
      clearTimeout(this._timers[notificationId]);
      delete this._timers[notificationId];
    }
    this._timers[notificationId] = setTimeout(
      () => {
        this.removeNotification(notificationId);
        delete this._timers[notificationId];
      },
      ttl || 2000,
    );
  },

  _indexOfNotification(notificationId, notifications) {
    for (let i = 0, len = notifications.length; i < len; i++) {
      if (notifications[i].props.id === notificationId) {
        return i;
      }
    }
    return -1;
  },
});

let _layer = null;

function _initializeLayer() {
  if (_layer !== null) {
    return _layer;
  }
  let element = document.createElement('div');
  document.body.appendChild(element);
  _layer = ReactDOM.render(<NotificationLayer />, element);
  return _layer;
}

export function showNotification(notification, getLayer = _initializeLayer) {
  if (notification === null) {
    return null;
  }
  if (!notification.props && !notification.type) {
    notification = <Notification {...notification} />;
  }
  let layer = getLayer();
  let notificationId = layer.showNotification(notification);
  return notificationId;
}

export function removeNotification(notificationId, getLayer = _initializeLayer) {
  if (notificationId === null) {
    return;
  }
  let layer = getLayer();
  layer.removeNotification(notificationId);
}
