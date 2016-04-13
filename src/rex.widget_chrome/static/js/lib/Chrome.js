/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';
import {
  Chrome as BaseChrome,
  DynamicPageContent,
  getLocation,
  subscribeLocationChange,
  unsubscribeLocationChange
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
            <DynamicPageContent shouldHandle={this.shouldHandle} content={content} />
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

  shouldHandle = (href) => {
    if (!this.props.manageContent) {
      return false;
    }
    let item = findMenuItem(this.props.menu, href);
    return item !== null;
  }

  onLocationChange = (location) => {
    let activeMenuItem = findMenuItem(this.props.menu, location.href);
    this.setState({location, activeMenuItem});
  }

  componentDidMount() {
    subscribeLocationChange(this.onLocationChange);
  }

  componentWillUnmount() {
    unsubscribeLocationChange(this.onLocationChange);
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
