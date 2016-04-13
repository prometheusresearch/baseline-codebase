/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {VBox} from '../layout';
import {LoadingIndicator} from '../ui';
import {fetch} from './fetch';
import {updateLocation, getLocation} from './PageManager';

function yes() {
  return true;
}

export default class DynamicPageContent extends React.Component {

  static defaultProps = {
    shouldHandle: yes,
  };

  state = {
    content: this.props.content,
    updating: false,
  };

  render() {
    let justifyContent = this.state.updating ? 'center' : undefined;
    return (
      <VBox flex={1} key={getLocation().href} justifyContent={justifyContent}>
        {this.state.updating ? <LoadingIndicator /> : this.state.content}
      </VBox>
    );
  }

  onPageFetched = (href, page) => {
    updateLocation({href});
    setTimeout(() => {
      this.setState({
        content: page.props.content,
        updating: false,
      });
    }, 10);
  }

  onPageError = (error) => {
    this.setState({updating: false});
    console.error(error); // eslint-disable-line no-console
  }

  hijackLinkClick = (event) => {
    let href = getHrefFromEventTarget(event.target);
    if (!href) {
      return;
    }
    if (!this.props.shouldHandle(href)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.setState({updating: true});
    fetch(href, {}, {useTransit: true})
      .then(this.onPageFetched.bind(null, href), this.onPageError);
  };

  componentDidMount() {
    document.addEventListener('click', this.hijackLinkClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.hijackLinkClick);
  }
}

function getHrefFromEventTarget(element) {
  do {
    if (element.tagName === 'A' && element.href) {
      return element.href;
    }
    element = element.parentElement;
  } while (element);

  return null;
}
