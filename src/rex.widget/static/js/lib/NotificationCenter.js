/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React             = require('react');
var {boxShadow, rgba} = require('./StyleUtils');
var Icon              = require('./Icon');
var {Box, HBox}       = require('./Layout');

var _notificationID = 0;

var NotificationStyle = {
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

var Notification = React.createClass({

  propTypes: {
    text: React.PropTypes.string,
    icon: React.PropTypes.string,
    kind: React.PropTypes.string,
    ttl: React.PropTypes.number
  },

  render() {
    var {children, text, icon, kind, style, ...props} = this.props;
    style = {
      ...NotificationStyle.self,
      ...(typeof kind === 'string' ? NotificationStyle[kind] : kind),
      ...style
    };
    return (
      <div {...props} style={style} id={undefined}>
        <HBox>
          {icon &&
            <Box style={NotificationStyle.icon} size={1}>
              <Icon name={icon} />
            </Box>}
          <Box size={10}>
            {children || text}
          </Box>
        </HBox>
      </div>
    );
  }
});

var NotificationLayerStyle = {
  self: {
    position: 'fixed',
    zIndex: 10000,
    top: 0,
    right: 0,
    width: '25%',
    padding: 15
  }
};

var NotificationLayer = React.createClass({

  render() {
    var notifications = this.state.notifications.map(notification =>
      React.cloneElement(notification, {
        key: notification.props.id,
        onClick: this.removeNotification.bind(null, notification.props.id)
      }));
    return (
      <div style={NotificationLayerStyle.self}>
        {notifications}
      </div>
    );
  },

  getInitialState() {
    return {
      notifications: []
    };
  },

  componentDidMount() {
    this._timers = {};
  },

  componentWillUnmount() {
    for (var id in this._timers) {
      if (this._timers.hasOwnProperty(id)) {
        clearTimeout(this._timers[id]);
      }
    }
    delete this._timers;
  },

  showNotification(notification) {
    _notificationID += 1;
    var id = _notificationID;
    var notifications = this.state.notifications.slice(0);
    notifications.push(React.cloneElement(notification, {id}));
    this.setState({notifications}, () => {
      if (notification.props.ttl !== Infinity) {
        this._scheduleRemove(id, notification.props.ttl);
      }
    });
    return _notificationID;
  },

  removeNotification(notificationId) {
    var idx = this._indexOfNotification(notificationId);
    if (idx > -1) {
      var notifications = this.state.notifications.slice(0);
      notifications.splice(idx, 1);
      this.setState({notifications});
    }
  },

  _scheduleRemove(notificationId, ttl) {
    if (this._timers[notificationId]) {
      clearTimeout(this._timers[notificationId]);
      delete this._timers[notificationId];
    }
    this._timers[notificationId] = setTimeout(() => {
      this.removeNotification(notificationId);
      delete this._timers[notificationId];
    }, ttl || 2000);
  },

  _indexOfNotification(notificationId) {
    var {notifications} = this.state;
    for (var i = 0, len = notifications.length; i < len; i++) {
      if (notifications[i].props.id === notificationId) {
        return i;
      }
    }
    return -1;
  }

});

var _layer = null;

function _initializeLayer() {
  if (_layer !== null) {
    return _layer;
  }
  var element = document.createElement('div');
  document.body.appendChild(element);
  _layer = React.render(<NotificationLayer />, element);
  return _layer;
}

function showNotification(notification) {
  if (!notification.props && !notification.type) {
    notification = <Notification {...notification} />;
  }
  var layer = _initializeLayer();
  var notificationId = layer.showNotification(notification);
  return notificationId;
}

function removeNotification(notificationId) {
  var layer = _initializeLayer();
  layer.removeNotification(notificationId);
}

module.exports = {
  showNotification,
  removeNotification,
  Notification
};
