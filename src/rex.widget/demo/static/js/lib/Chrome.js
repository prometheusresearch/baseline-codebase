/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';
import ChromeBase from 'rex-widget/lib/Chrome';
import resolveURL from 'rex-widget/lib/resolveURL';
import * as UI from 'rex-widget/ui';
import * as Layout  from 'rex-widget/layout';
import * as CSS from 'rex-widget/css';
import * as Stylesheet from 'rex-widget/stylesheet';

let Header = Stylesheet.apply(UI.Panel, {
  flexDirection: 'row',
  background: '#BB4848',
  color: '#FFFFFF',
  border: CSS.none,
  padding: 20,
});

let Title = Stylesheet.apply('div', {
  fontSize: '20pt',
  fontWeight: 900,
});

let Menu = Stylesheet.apply(Layout.HBox, {
  flex: 1,
  justifyContent: 'flex-end',
});

let _MenuButton = Stylesheet.apply(UI.ButtonBase, {
  Root: {
    Component: 'a',
    cursor: CSS.cursor.pointer,
    fontWeight: 400,
    color: 'white',
    fontSize: '90%',
    padding: '10px 10px',
    textTransform: 'uppercase',
    background: '#BB4848',
    border: CSS.none,
    borderBottom: CSS.border(2, '#BB4848'),
    hover: {
      borderBottom: CSS.border(2, '#C76D6D'),
    },
    focus: {
      outline: CSS.none,
      borderBottom: CSS.border(2, '#C76D6D'),
    },
    active: {
      borderBottom: CSS.border(2, 'white'),
      hover: {
        borderBottom: CSS.border(2, 'white'),
      }
    }
  }
});

function MenuButton({href = '/', ...props}) {
  href = resolveURL(href);
  let active = isActiveMenuItem({href});
  return <_MenuButton {...props} active={active} href={href} tabIndex={-1} />;
}

let ContentWrapper = Stylesheet.apply(Layout.VBox, {
  width: 800,
  padding: 25,
  margin: '0 auto',
});

function getActiveMenuItem(menu) {
  return menu.find(isActiveMenuItem) || null;
}

function isActiveMenuItem(item) {
  return resolveURL(item.href) === window.location.href
}

export default function Chrome({content, menu, ...props}) {
  let menuItems = menu.map(item =>
    <MenuButton key={item.href} href={item.href}>{item.title}</MenuButton>);
  let activeMenuItem = getActiveMenuItem(menu);
  let title = `Rex Widget / ${activeMenuItem.title}`;
  return (
    <ChromeBase {...props} title={title}>
      <Header>
        <Title>{title}</Title>
        <Menu>{menuItems}</Menu>
      </Header>
      <ContentWrapper>{content}</ContentWrapper>
    </ChromeBase>
  );
}
