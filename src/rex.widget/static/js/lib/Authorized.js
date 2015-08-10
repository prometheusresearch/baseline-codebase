/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React   from 'react';
import {fetch} from './fetch';

/**
 * Component which renders its children only if authorization check succeeds.
 * Authorization check is performed against the URL passed in as ``access``
 * prop.
 *
 * @public
 */
export default class Authorized extends React.Component {

  static propTypes = {
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
      });
  }
  return result;
}
