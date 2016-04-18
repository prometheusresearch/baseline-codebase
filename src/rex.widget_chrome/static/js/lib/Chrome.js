/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';
import {
  Chrome as BaseChrome,
  DynamicPageContent,
  getLocation,
  updateLocation,
  subscribeLocationChange,
  unsubscribeLocationChange,
  pageContextTypes
} from 'rex-widget/page';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';
import Header from './Header';

let style = stylesheet.create({
  Content: {
    Component: layout.VBox,
    flex: 1,
  }
});

export default class Chrome extends React.Component {

  static childContextTypes = pageContextTypes;

  constructor(props) {
    super(props);
    let location = getLocation();
    let activeMenuItem = findMenuItem(this.props.menu, location.href);
    this.state = {location, activeMenuItem};
  }

  render() {
    let {
      title,
      username,
      userProfileUrl,
      applicationBanner,
      applicationTitle,
      applicationLogoutUrl,
      content,
      menu,
      siteRoot,
      ...props
    } = this.props;
    let {location, activeMenuItem} = this.state;
    return (
      <BaseChrome title={activeMenuItem ? activeMenuItem.title : title} {...props}>
        <layout.VBox flex={1} direction="column-reverse">
          <style.Content>
            <DynamicPageContent
              content={content}
              onNavigation={this.onNavigation}
              location={location}
              />
          </style.Content>
          <Header
            key={location.href}
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
        </layout.VBox>
      </BaseChrome>
    );
  }

  getChildContext() {
    let {activeMenuItem: {title, url}} = this.state;
    return {
      navigationStack: [{title, url}]
    };
  }

  componentDidMount() {
    subscribeLocationChange(this.onLocationChange);
  }

  componentWillUnmount() {
    unsubscribeLocationChange(this.onLocationChange);
  }

  onNavigation = (href) => {
    if (!this.props.manageContent) {
      return false;
    }
    let item = findMenuItem(this.props.menu, href);
    if (item === null) {
      return false;
    }
    updateLocation({href});
    return true;
  }

  onLocationChange = (location) => {
    let activeMenuItem = findMenuItem(this.props.menu, location.href);
    this.setState({location, activeMenuItem});
  }
}

function findMenuItem(menu, href) {
  for (let i = 0; i < menu.length; i++) {
    let item = menu[i];
    for (let j = 0; j < item.items.length; j++) {
      if (item.items[j].url === href) {
        return item.items[j];
      }
    }
  }
  return null;
}
