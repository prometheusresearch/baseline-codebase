/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {getHistory} from './History';

const MESSAGES = [];

const BEFOREUNLOAD_EVENT = 'beforeunload';

/**
 * Component which marks a UI as one which require a confirm dialog before
 * navigating away.
 *
 * Use like:
 *
 *    import {ConfirmNavigation} from 'rex-action'
 *
 *    <ConfirmNavigation message="Form is not submitted" />
 *
 * In router code:
 *
 *    import {confirmNavigation} from 'rex-action'
 *
 *    if (confirmNavigation()) {
 *      // change router state here
 *    }
 *
 * The last part is actually implemented by Rex Action router.
 *
 * The machinery for `"beforeunload"` event is also present if any
 * `<ConfirmNavigation />` is in the DOM.
 *
 * @public
 */
export default class ConfirmNavigation extends React.Component {

  static propTypes = {
    message: React.PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this._message = {message: props.message};
  }

  render() {
    return null;
  }

  componentWillReceiveProps({message}) {
    if (message !== this.props.message) {
      allow(this._message);
      this._message = {message};
      prevent(this._message);
    }
  }

  componentDidMount() {
    prevent(this._message);
  }

  componentWillUnmount() {
    allow(this._message);
  }

  allow() {
    if (!this.isAllowed()) {
      allow(this._message);
    }
  }

  prevent() {
    if (this.isAllowed()) {
      prevent(this._message);
    }
  }

  isAllowed() {
    return MESSAGES.indexOf(this._message) === -1;
  }
}

function onBeforeLocation() {
  let message = getMessage();
  if (message !== null) {
    return message;
  }
}

function prevent(message) {
  MESSAGES.push(message);
  if (MESSAGES.length === 1) {
    let history = getHistory();
    window.addEventListener(BEFOREUNLOAD_EVENT, onBeforeUnload);
    onBeforeLocation.cancel = history.listenBefore(onBeforeLocation);
  }
}

function allow(message) {
  let idx = MESSAGES.indexOf(message);
  if (idx > -1) {
    MESSAGES.splice(idx, 1);
    if (MESSAGES.length === 0) {
      window.removeEventListener(BEFOREUNLOAD_EVENT, onBeforeUnload);
      onBeforeLocation.cancel && onBeforeLocation.cancel();
    }
  }
}

function getMessage() {
  return MESSAGES.length === 0 ? null : MESSAGES[MESSAGES.length - 1];
}

function onBeforeUnload(e) {
  let message = getMessage();
  if (message !== null) {
    e.returnValue = message.message;
    return message;
  }
}


export function confirmNavigation() {
  let message = getMessage();
  if (message === null) {
    return true;
  } else {
    return window.confirm(message.message);
  }
}
