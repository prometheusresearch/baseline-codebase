/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';
import BaseChrome from 'rex-widget/lib/Chrome';
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

    return (
      <BaseChrome title={title} {...props}>
        <layout.VBox flex={1} direction="column-reverse">
          <style.Content>
            {content}
          </style.Content>
          <Header
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
}
