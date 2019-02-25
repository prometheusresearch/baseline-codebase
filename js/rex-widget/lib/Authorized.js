/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React   from 'react';
import {fetch} from './fetch';

/**
 * Component which renders either **children** or **fallback** elements
 * as the authorization check either succeeds or fails.
 * The authorization check is performed against the **access** URL.
 *
 * @public
 */
export default class Authorized extends React.Component {

  static propTypes = {
    /**
     * The URL in pkg:/path format which checks if the current user
     * has access.
     */
    access: React.PropTypes.string.isRequired,

    /**
     * Elements to render in case the authorization check succeeds.
     */
    children: React.PropTypes.element,

    /**
     * Elements to render in case the authorization check fails.
     */
    fallback: React.PropTypes.element
  };

  static defaultProps = {
    access: null,
    fallback: null
  };

  constructor(props) {
    super(props);
    this.state = this._stateFromProps(this.props);
  }

  render() {
    let {children, fallback} = this.props;
    let {access} = this.state;
    if (!access) {
      return fallback;
    } else {
      return React.Children.only(children);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.access !== nextProps.access) {
      this.setState(this._stateFromProps(nextProps));
    }
  }

  componentDidMount() {
    this._checkAccess();
  }

  componentDidUpdate() {
    this._checkAccess();
  }

  _checkAccess() {
    if (this.state.access === null) {
      checkAccessTo(this.props.access).then(() => {
        this.setState(this._stateFromProps(this.props));
      });
    }
  }

  _stateFromProps(props) {
    return {access: hasAccessTo(props.access)};
  }

}

let PERMISSIONS_API_ENDPOINT;
/* istanbul ignore next */
if (typeof __REX_WIDGET_MOUNT_PREFIX__ !== 'undefined') {
  PERMISSIONS_API_ENDPOINT = `${__REX_WIDGET_MOUNT_PREFIX__}/authorized`;
} else {
  PERMISSIONS_API_ENDPOINT = '/authorized';
}


// Map<String, Boolean | Promise<Boolean>>
let _access = {};

function hasAccessTo(access) {
  let result = checkAccessTo(access);
  // still a promise, wait
  if (result && typeof result.then === 'function') {
    return null;
  } else {
    return result;
  }
}

function checkAccessTo(access) {
  let result = _access[access];
  if (result === undefined) {
    result = _access[access] = fetch(PERMISSIONS_API_ENDPOINT, {access})
      .then(response => {
        let {authorized} = response;
        _access[access] = authorized;
      }, error => {
        /* istanbul ignore next */
        console.error(error); // eslint-disable-line no-console
      });
  }
  return result;
}
