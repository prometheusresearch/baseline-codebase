/**
 * @copyright 2019, Prometheus Research, LLC
 * @flow
 */

import * as React from "react";
import * as styles from "@material-ui/styles";
import * as mui from "@material-ui/core";
import * as icons from "@material-ui/icons";
import * as History from "rex-ui/History";

import { DynamicPageContent } from "rex-widget/page";
import { VBox } from "react-stylesheet";
import ChromeBase from "./ChromeBase";
import Header from "./Header";
import ErrorMessage from "./ErrorMessage";
import { type Menu, type MenuItem } from "./NavMenu";

type PageContextType = {
  navigationStack: MenuItem[]
};

export let PageContext = React.createContext<PageContextType>({
  navigationStack: []
});

export let usePageContext = () => React.useContext(PageContext);

type Props = {
  title: string,
  username: string,
  userProfileUrl: string,
  applicationBanner: string,
  applicationTitle: string,
  applicationLogoutUrl: string,
  content: any,
  settings: any,
  menu: Menu,
  siteRoot: string
};

type State = {
  hasError: boolean,
  location: History.Location,
  activeMenuItem: Object
};

export default class Chrome extends React.Component<Props, State> {
  static getDerivedStateFromError(_error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  constructor(props: Props) {
    super(props);
    let location = History.getBrowserHistory().location;
    let activeMenuItem = findMenuItem(this.props.menu, location.pathname);
    this.state = {
      hasError: false,
      location,
      activeMenuItem
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // $FlowFixMe: ...
    if (typeof Raven !== "undefined") {
      Raven.captureException(error, { extra: errorInfo });
    }
  }

  onReload = () => {
    this.setState({ hasError: false });
    this.onNavigation(this.state.location.pathname);
  };

  render() {
    let {
      title,
      username,
      userProfileUrl,
      applicationBanner,
      applicationTitle,
      applicationLogoutUrl,
      content,
      settings,
      menu,
      siteRoot,
      ...props
    } = this.props;
    let { location, activeMenuItem, hasError } = this.state;

    let navigationStack = [];
    if (activeMenuItem != null) {
      navigationStack.push(activeMenuItem);
    }
    let pageContext = { navigationStack };

    return (
      <PageContext.Provider value={pageContext}>
        <ChromeBase
          title={activeMenuItem ? activeMenuItem.title : title}
          {...props}
        >
          <VBox flexGrow={1} flexShrink={1} flexDirection="column-reverse">
            <VBox flexGrow={1} flexShrink={1}>
              {hasError ? (
                <ErrorMessage onReload={this.onReload} />
              ) : (
                <DynamicPageContent
                  content={content}
                  onNavigation={this.onNavigation}
                  location={location}
                />
              )}
            </VBox>
            <Header
              key={location.pathname}
              location={location}
              title={title}
              menu={menu}
              siteRoot={siteRoot}
              username={username}
              userProfileUrl={userProfileUrl}
              applicationBanner={applicationBanner}
              applicationTitle={applicationTitle}
              applicationLogoutUrl={applicationLogoutUrl}
            />
          </VBox>
        </ChromeBase>
      </PageContext.Provider>
    );
  }

  _stopListening: () => void;

  componentDidMount() {
    this._stopListening = History.getBrowserHistory().listen(
      this.onLocationChange
    );
  }

  componentWillUnmount() {
    this._stopListening();
  }

  onNavigation = (pathname: string) => {
    if (!this.props.settings.manageContent) {
      return false;
    }
    let item = findMenuItem(this.props.menu, pathname);
    if (item === null) {
      return false;
    }
    History.getBrowserHistory().push(pathname);
    return true;
  };

  onLocationChange = (location: History.Location, action: History.Action) => {
    // Location can be changed not just b/c of pathname change, we are only
    // interested in the latter though.
    if (location.pathname === this.state.location.pathname) {
      return;
    }
    let activeMenuItem = findMenuItem(this.props.menu, location.pathname);
    this.setState({ location, activeMenuItem });
  };
}

function findMenuItem(menu: Menu, pathname: string) {
  for (let i = 0; i < menu.length; i++) {
    let item = menu[i];
    if (item.url === window.location.origin + pathname) {
      return item;
    }
    if (item.items != null) {
      let found = findMenuItem(item.items, pathname);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
