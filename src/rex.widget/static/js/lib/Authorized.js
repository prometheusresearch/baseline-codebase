/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React = require('react');
var Promise = require('./Promise');
var request = require('./request');

/**
 * Component which renders its children only if authorization check succeeds.
 * Authorization check is performed against the URL passed in as ``access``
 * prop.
 */
var Authorized = React.createClass({

  propTypes: {
    /**
     * An URL in pkg:/path format to check if current user has access to.
     */
    access: React.PropTypes.string.isRequired,

    /**
     * Elements to render in case authorization check succeeds.
     */
    children: React.PropTypes.element,

    /**
     * Elements to render in case authorization check fails.
     */
    fallback: React.PropTypes.element
  },

  render() {
    var {children, fallback} = this.props;
    var {access} = this.state;
    if (!access) {
      return fallback;
    } else {
      return React.Children.only(children);
    }
  },

  getDefaultProps() {
    return {
      access: null,
      fallback: null
    }
  },

  getInitialState() {
    return this._stateFromProps(this.props);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.access !== nextProps.access) {
      this.setState(this._stateFromProps(nextProps));
    }
  },

  componentDidMount() {
    this._checkAccess();
  },

  componentDidUpdate() {
    this._checkAccess();
  },

  _checkAccess() {
    if (this.state.access === null) {
      checkAccessTo(this.props.access).then(() => {
        this.setState(this._stateFromProps(this.props));
      });
    }
  },

  _stateFromProps(props) {
    return {access: hasAccessTo(props.access)};
  }

});


var PERMISSIONS_API_ENDPOINT;
if (typeof __REX_WIDGET_MOUNT_PREFIX__ !== 'undefined') {
  PERMISSIONS_API_ENDPOINT = `${__REX_WIDGET_MOUNT_PREFIX__}/authorized`;
} else {
  PERMISSIONS_API_ENDPOINT = '/authorized';
}


// Map<String, Boolean | Promise<Boolean>>
var _access = {};

function hasAccessTo(access) {
  var result = checkAccessTo(access);
  if (result.isFulfilled()) {
    return result.value();
  } else if (result.isRejected()) {
    throw result.reason();
  } else {
    return null;
  }
}

function checkAccessTo(access) {
  var result = _access[access];
  if (result === undefined) {
    result = _access[access] = request('GET', PERMISSIONS_API_ENDPOINT)
      .query({access})
      .promise()
      .then(response => response.body.authorized);
  }
  return result;
}

module.exports = Authorized;
