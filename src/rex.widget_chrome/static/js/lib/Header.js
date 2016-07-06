/**
 * @copyright 2015, Prometheus Research, LLC
 */

import * as Nav from '@prometheusresearch/react-ui/topNav';
import React from 'react';
import SignOutIcon from 'react-icons/lib/fa/sign-out';
import UserIcon from 'react-icons/lib/fa/user';
import resolveURL from 'rex-widget/lib/resolveURL';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';

let ApplicationBanner = stylesheet.style('div', {
  fontSize: '8pt'
});

export default class Header extends React.Component {

  render() {
    let {
      menu,
      username,
      userProfileUrl,
      applicationBanner,
      applicationTitle,
      applicationLogoutUrl,
      siteRoot,
      location,
      hideSecondTierMenu
    } = this.props;

    let selectedFirst = null;

    let itemsFirst = [];
    let itemsSecond = [];

    for (let i = 0; i < menu.length; i++) {
      let itemFirst = menu[i];
      let selectedSecond = null;
      selectedFirst = isCurrentLocation(location, itemFirst.url);

      if (itemFirst.items) {
        for (let j = 0; j < itemFirst.items.length; j++) {
          let itemSecond = itemFirst.items[j];
          if (isCurrentLocation(location, itemSecond.url)) {
            selectedFirst = true;
            selectedSecond = itemSecond.url;
          }
        }

        if (selectedFirst && !hideSecondTierMenu) {
          itemsSecond = itemFirst.items.map(item =>
            <Nav.SecondaryButton
              variant={{open: selectedSecond === item.url}}
              href={item.url}
              key={item.url}>
              {item.title}
            </Nav.SecondaryButton>
          );
        }
      }

      if (itemFirst.permitted) {
        let items = itemFirst.items.map(item =>
          <Nav.PrimaryMenuItem
            key={item.url}
            href={item.url}
            variant={{selected: selectedSecond === item.url}}>
            {item.title}
          </Nav.PrimaryMenuItem>
        );
        itemsFirst.push(
          <Nav.PrimaryMenu
            key={itemKey(itemFirst)}
            items={items}
            href={itemFirst.url}
            variant={{selected: selectedFirst}}>
            {itemFirst.title}
          </Nav.PrimaryMenu>
        );
      }
    }

    let applicationMenu = [
      userProfileUrl &&
        <Nav.PrimaryButton
          key="user"
          href={resolveURL(userProfileUrl)}
          icon={<UserIcon />}
          variant={{small: true}}>
          {username}
        </Nav.PrimaryButton>,
      applicationLogoutUrl &&
        <Nav.PrimaryButton
          key="logout"
          href={resolveURL(applicationLogoutUrl)}
          icon={<SignOutIcon />}
          variant={{small: true}}
          />
    ];

    return (
      <Nav.Navigation
        title={
          <layout.VBox>
            <Nav.Title href={resolveURL(siteRoot)}>
              {applicationTitle}
            </Nav.Title>
            {applicationBanner &&
              <ApplicationBanner>
                {applicationBanner}
              </ApplicationBanner>}
          </layout.VBox>
        }
        menu={itemsFirst}
        secondaryMenu={!hideSecondTierMenu && itemsSecond}
        applicationMenu={applicationMenu}
        />
    );
  }
}

function isCurrentLocation(location, href) {
  if (href) {
    href = resolveURL(href);
  }
  return location.href === href;
}

function itemKey(item) {
  if (item.key != null) {
    return item.key;
  } else if (item.url != null) {
    return item.url;
  } else {
    return item.title;
  }
}
