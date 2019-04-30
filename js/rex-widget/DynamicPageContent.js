/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { VBox } from "react-stylesheet";
import { fetch } from "./fetch";
import * as rexui from "rex-ui";

type Props = {|
  content: React.Node,
  location: Location,
  onNavigation: (href: string) => boolean
|};

type State = {
  content: React.Node,
  updating: boolean
};

export default class DynamicPageContent extends React.Component<Props, State> {
  state: State = {
    content: this.props.content,
    updating: false
  };

  render() {
    let { location } = this.props;
    return (
      <VBox flexGrow={1} flexShrink={1} key={location.href}>
        {this.state.updating ? <rexui.PreloaderScreen /> : this.state.content}
      </VBox>
    );
  }

  componentWillReceiveProps({ location }: Props) {
    this.setState({ updating: true });
    fetch(location.href, {}, { useTransit: true }).then(
      this.onPageFetched.bind(null, location.href),
      this.onPageError
    );
  }

  onPageFetched = (href: string, page: { props: { content: React.Node } }) => {
    setTimeout(() => {
      this.setState({
        content: page.props.content,
        updating: false
      });
    }, 10);
  };

  onPageError = (error: Error) => {
    this.setState({ updating: false });
    console.error(error);
  };

  hijackLinkClick = (event: MouseEvent) => {
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
    document.addEventListener("click", this.hijackLinkClick);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.hijackLinkClick);
  }
}

function isMainClick(event: MouseEvent) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.altKey &&
    // $FlowFixMe: ...
    !event.ctrlkey &&
    !event.shiftKey
  );
}

function getHrefFromEventTarget(element): null | string {
  do {
    if (element.tagName === "A" && element.href) {
      // $FlowFixMe: ...
      return element.href;
    }
    // $FlowFixMe: ...
    element = element.parentElement;
  } while (element);

  return null;
}
