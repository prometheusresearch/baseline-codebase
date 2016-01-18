/**
 * @copyright 2016, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';

import {getHistory} from './History';

const MESSAGES = [];

const BEFOREUNLOAD_EVENT = 'beforeunload';

export default class PreventNavigation extends React.Component {

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
    return MESSAGES.indexOf(message) === -1;
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
      onBeforeLocation.cancel();
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

function onBeforeLocation() {
  let message = getMessage();
  if (message !== null) {
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
