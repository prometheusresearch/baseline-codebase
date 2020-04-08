/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import { VBox } from "react-stylesheet";
import { fetch } from "./fetch";
import * as rexui from "rex-ui";
import * as History from "rex-ui/History";

type Props = {|
  content: React.Node,
  location: History.Location,
  onNavigation: (pathname: string) => boolean,
  preloader?: React.Node,
|};

type State = {
  content: React.Node,
  updating: boolean
};

export default class DynamicPageContent extends React.Component<Props, State> {
  static defaultProps = {
    preloader: <rexui.PreloaderScreen />
  };

  state: State = {
    content: this.props.content,
    updating: false
  };

  render() {
    let { location, preloader } = this.props;
    return (
      <VBox flexGrow={1} flexShrink={1} key={location.pathname}>
        {this.state.updating ? preloader : this.state.content}
      </VBox>
    );
  }

  componentWillReceiveProps({ location }: Props) {
    this.setState({ updating: true });
    fetch(location.pathname, {}, { useTransit: true }).then(
      this.onPageFetched.bind(null, location.pathname),
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
    let pathname = getPathnameOfElement(event.target);
    if (pathname == null) {
      return;
    }
    if (this.props.onNavigation(pathname)) {
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

function getPathnameOfElement(element): null | string {
  do {
    if (element.tagName === "A" && element.href) {
      let href: string = (element.href: any);
      // Remove origin from href so we get a pathname
      let origin = window.location.origin;
      if (href.slice(0, origin.length) === origin) {
        href = href.slice(origin.length);
      }
      return href;
    }
    // $FlowFixMe: ...
    element = element.parentElement;
  } while (element);

  return null;
}
