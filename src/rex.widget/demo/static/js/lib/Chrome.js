/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import ChromeBase from 'rex-widget/lib/Chrome';
import resolveURL from 'rex-widget/lib/resolveURL';
import * as ui from 'rex-widget/ui';
import * as layout  from 'rex-widget/layout';
import * as css from 'rex-widget/css';
import * as stylesheet from 'rex-widget/stylesheet';

let Header = stylesheet.style(ui.Panel, {
  flexDirection: 'row',
  background: '#BB4848',
  color: '#FFFFFF',
  border: css.none,
  padding: 20,
});

let Title = stylesheet.style('div', {
  fontSize: '20pt',
  fontWeight: 900,
});

let Menu = stylesheet.style(layout.HBox, {
  flex: 1,
  justifyContent: 'flex-end',
});

let _MenuButton = stylesheet.style(ui.ButtonBase, {
  Root: {
    Component: 'a',
    cursor: css.cursor.pointer,
    fontWeight: 400,
    color: 'white',
    fontSize: '90%',
    padding: '10px 10px',
    textTransform: 'uppercase',
    background: '#BB4848',
    border: css.none,
    borderBottom: css.border(2, '#BB4848'),
    hover: {
      borderBottom: css.border(2, '#C76D6D'),
    },
    focus: {
      outline: css.none,
      borderBottom: css.border(2, '#C76D6D'),
    },
    active: {
      borderBottom: css.border(2, 'white'),
      hover: {
        borderBottom: css.border(2, 'white'),
      }
    }
  }
});

function MenuButton({href = '/', ...props}) {
  href = resolveURL(href);
  let active = isActiveMenuItem({href});
  return <_MenuButton {...props} active={active} href={href} tabIndex={-1} />;
}

let ContentWrapper = stylesheet.style(layout.VBox, {
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
