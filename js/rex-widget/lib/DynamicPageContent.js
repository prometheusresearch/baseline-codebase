/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import React from 'react';
import {VBox} from '../layout';
import {LoadingIndicator} from '../ui';
import {fetch} from './fetch';

export default class DynamicPageContent extends React.Component {

  static defaultProps = {
    location: React.PropTypes.object.isRequired,
  };

  state = {
    content: this.props.content,
    updating: false,
  };

  render() {
    let {location} = this.props;
    let justifyContent = this.state.updating ? 'center' : undefined;
    return (
      <VBox flex={1} key={location.href} justifyContent={justifyContent}>
        {this.state.updating ? <LoadingIndicator /> : this.state.content}
      </VBox>
    );
  }

  componentWillReceiveProps({location}) {
    this.setState({updating: true});
    fetch(location.href, {}, {useTransit: true}).then(
      this.onPageFetched.bind(null, location.href),
      this.onPageError);
  }

  onPageFetched = (href, page) => {
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
    if (!isMainClick(event)) {
      return;
    }
    let href = getHrefFromEventTarget(event.target);
    if (!href) {
      return;
    }
    if (this.props.onNavigation(href)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  componentDidMount() {
    document.addEventListener('click', this.hijackLinkClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.hijackLinkClick);
  }
}

function isMainClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    !event.ctrlkey &&
    !event.shiftKey
  );
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
