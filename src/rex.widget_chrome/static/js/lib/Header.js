/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React from 'react';
import ReactDOM from 'react-dom';
import invariant from 'invariant';
import BaseChrome from 'rex-widget/lib/Chrome';
import * as ui from 'rex-widget/ui';
import resolveURL from 'rex-widget/lib/resolveURL';
import * as layout from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';
import * as css from 'rex-widget/css';
import Theme from './Theme';

let style = stylesheet.create({

  Top: {
    Component: layout.HBox,
    boxShadow: Theme.header.boxShadow,
    background: Theme.header.background,
    color: Theme.header.text,
    border: css.none,
    height: Theme.header.height,
    justifyContent: 'center',
  },

  Bottom: layout.HBox,

  Navigation: {
    Component: layout.HBox,
    alignItems: 'flex-end',
    flex: 1,
  },

  HeaderButton: {
    Component: ui.ButtonBase,
    Caption: {
      verticalAlign: 'middle',
    },
    IconWrapper: {
      hasCaption: {
        marginRight: 5
      }
    },
    Root: {
      Component: 'a',
      cursor: css.cursor.pointer,
      fontWeight: 400,
      fontSize: '12pt',
      position: 'relative',
      textShadow: Theme.header.textShadow,
      height: Theme.header.height,
      color: Theme.header.text,
      background: Theme.header.background,
      border: css.none,
      padding: css.padding(20, 30),
      selected: {
        background: Theme.subHeader.background,
        height: Theme.header.height,
        top: 1,
      },
      open: {
        background: Theme.header.hover.background,
      },
      hover: {
        background: Theme.header.hover.background,
      },
      focus: {
        outline: css.none,
      },
      small: {
        fontSize: '12pt',
      }
    }
  },

  HeaderMenuButton: {
    Component: ui.ButtonBase,
    Root: {
      Component: 'a',
      cursor: css.cursor.pointer,
      fontWeight: 400,
      fontSize: '9pt',
      color: Theme.header.text,
      background: Theme.headerMenu.background,
      border: css.none,
      padding: css.padding(10, 10, 10, 30),
      focus: {
        outline: css.none,
      },
      hover: {
        background: Theme.headerMenu.hover.background
      }
    }
  },

  HeaderMenu: {
    Component: layout.VBox,
    position: 'absolute',
    background: Theme.headerMenu.background,
    zIndex: 1000,
    minWidth: 200,
    paddingTop: 10,
    paddingBottom: 10,
    boxShadow: css.boxShadow(0, 8, 16, 0, css.rgba(0, 0, 0, 0.2)),
  },

  SubNavigation: {
    Component: layout.HBox,
    boxShadow: Theme.subHeader.boxShadow,
    background: Theme.subHeader.background,
    color: Theme.subHeader.text,
    border: css.display.block,
    height: Theme.subHeader.height,
    paddingLeft: 208,
    width: '100%',
    collapsed: {
      height: 5
    },
  },

  SubHeaderButton: {
    Component: ui.ButtonBase,
    Root: {
      Component: 'a',
      display: 'inline-flex',
      alignItems: 'center',
      textDecoration: 'none',
      cursor: 'pointer',
      fontWeight: 400,
      textShadow: Theme.subHeader.textShadow,
      fontSize: '10pt',
      position: 'relative',
      color: Theme.subHeader.text,
      background: Theme.subHeader.background,
      border: css.none,
      height: Theme.subHeader.height,
      padding: css.padding(0, 25),
      borderTop: css.border(4, Theme.subHeader.background),
      borderBottom: css.border(4, Theme.subHeader.background),
      open: {
        borderBottom: css.border(5, Theme.header.background),
      },
      focus: {
        outline: css.none,
      },
    }
  },

  ApplicationLogo: {
    Component: layout.VBox,
    justifyContent: 'flex-end',
    padding: '5px 10px',
  },

  ApplicationBanner: {
    fontSize: '8pt'
  },

  ApplicationTitle: {
    Component: 'a',
    alignSelf: 'center',
    fontSize: '19pt',
    fontWeight: 700,
    cursor: css.cursor.default,
    textShadow: Theme.header.textShadow,
    margin: 0,
    color: Theme.header.text,
    textDecoration: css.none,
    cursor: css.cursor.pointer
  },

  ApplicationMenu: {
    Component: layout.HBox,
    alignItems: 'flex-start',
    marginRight: 5
  }

});

class SubNavigation extends React.Component {

  constructor(props) {
    super(props);
    this.state = {open: null};
  }

  render() {
    let {items} = this.props;
    let {open} = this.state;
    let collapsed = items.length === 0;
    items = items.map(item => {
      let key = itemKey(item);
      if (!item.permitted) {
        return null;
      }
      return (
        <style.SubHeaderButton
          key={key}
          href={item.url ? resolveURL(item.url) : item.url}
          target={item.new_window ? '_blank' : undefined}
          onMouseEnter={this.onMouseEnter.bind(null, key)}
          onMouseLeave={this.onMouseLeave.bind(null, key)}
          variant={{open: open ? open === key : item.open}}>
          {item.title}
        </style.SubHeaderButton>
      )
    }).filter(Boolean);
    return (
      <style.SubNavigation variant={{collapsed}}>
        {items}
      </style.SubNavigation>
    );
  }

  @autobind
  onMouseEnter(open) {
    this.setState({open});
  }

  @autobind
  onMouseLeave() {
    this.setState({open: null});
  }
}


class TopNavigationButton extends React.Component {

  static defaultProps = {
    items: []
  };

  constructor(props) {
    super(props);
    this.state = {open: false};
  }

  render() {
    let {
      children,
      title,
      hover,
      selected,
      onClick,
      href,
      items,
      ...props
    } = this.props;
    let {open} = this.state;
    return (
      <layout.VBox
        {...props}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}>
        <style.HeaderButton
          href={href}
          onClick={onClick}
          variant={{open, selected}}>
          {title}
        </style.HeaderButton>
        {open &&
          <style.HeaderMenu>
            {items.map(item =>
              item.permitted ?
                <style.HeaderMenuButton
                  key={itemKey(item)}
                  href={item.url ? resolveURL(item.url) : item.url}
                  target={item.new_window ? '_blank' : undefined}>
                  {item.title}
                </style.HeaderMenuButton> :
                null)}
          </style.HeaderMenu>}
      </layout.VBox>
    );
  }

  @autobind
  onMouseEnter() {
    this.setState({open: true});
  }

  @autobind
  onMouseLeave() {
    if (!this.props.open) {
      this.setState({open: false});
    }
  }
}

export default class Header extends React.Component {

  render() {
    let {
      title,
      content,
      menu,
      username,
      userProfileUrl,
      applicationBanner,
      applicationTitle,
      applicationLogoutUrl,
      siteRoot,
      location,
      ...props
    } = this.props;

    let selectedFirst = null;

    let itemsFirst = [];
    let itemsSecond = [];

    for (let i = 0; i < menu.length; i++) {
      let itemFirst = menu[i];
      selectedFirst = isCurrentLocation(location, itemFirst.url);

      if (itemFirst.items) {
        for (let j = 0; j < itemFirst.items.length; j++) {
          let itemSecond = itemFirst.items[j];
          let selectedSecond = isCurrentLocation(location, itemSecond.url);
          selectedFirst = selectedFirst || selectedSecond;
        }

        if (selectedFirst) {
          itemsSecond = itemFirst.items.map(item => ({
            ...item,
            open: isCurrentLocation(location, item.url)
          }));
        }
      }

      if (itemFirst.permitted) {
        itemsFirst.push(
          <TopNavigationButton
            key={itemKey(itemFirst)}
            items={itemFirst.items}
            href={itemFirst.url}
            selected={selectedFirst}
            title={itemFirst.title}
            />
        );
      }
    }

    let collapsed = itemsSecond.length === 0;

    return (
      <layout.VBox direction="column-reverse">
        <style.Bottom>
          <SubNavigation items={itemsSecond} />
        </style.Bottom>
        <style.Top>
          <style.ApplicationLogo>
            <style.ApplicationTitle href={resolveURL(siteRoot)}>
              {applicationTitle}
            </style.ApplicationTitle>
            {applicationBanner &&
              <style.ApplicationBanner>
                {applicationBanner}
              </style.ApplicationBanner>}
          </style.ApplicationLogo>
          <style.Navigation>
            {itemsFirst}
          </style.Navigation>
          <style.ApplicationMenu>
            {userProfileUrl &&
              <style.HeaderButton
                href={resolveURL(userProfileUrl)}
                icon="user"
                variant={{small: true}}>
                {username}
              </style.HeaderButton>}
            {applicationLogoutUrl &&
              <style.HeaderButton
                href={resolveURL(applicationLogoutUrl)}
                icon="log-out"
                variant={{small: true}}
                />}
          </style.ApplicationMenu>
        </style.Top>
      </layout.VBox>
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
