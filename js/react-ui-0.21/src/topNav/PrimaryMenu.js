/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import * as React from 'react';
import {VBox} from '@prometheusresearch/react-box';

import {css, style} from '../stylesheet';
import theme from './theme';

import ButtonBase from '../ButtonBase';
import PrimaryButton from './PrimaryButton';

let PrimaryMenuContainer = style(VBox, {
  position: 'absolute',
  top: theme.header.height,
  background: theme.headerMenu.background,
  zIndex: 1000,
  minWidth: 200,
  paddingTop: 10,
  paddingBottom: 10,
  boxShadow: css.boxShadow(0, 8, 16, 0, css.rgba(0, 0, 0, 0.2)),
});

export let PrimaryMenuItem = style(ButtonBase, {
  Root: {
    Component: 'a',
    cursor: css.cursor.pointer,
    fontWeight: 400,
    fontSize: '9pt',
    color: theme.header.text,
    background: theme.headerMenu.background,
    border: css.none,
    padding: css.padding(10, 10, 10, 30),
    focus: {
      outline: css.none,
    },
    hover: {
      background: theme.headerMenu.hover.background
    },
    selected:{
      background: theme.subHeader.background,
      hover: {
        background: theme.subHeader.background,
      }
    },
  }
});

export class PrimaryMenu extends React.Component {

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
      href,
      items,
      variant,
      ...props
    } = this.props;
    let {open} = this.state;
    return (
      <VBox
        {...props}
        onMouseEnter={items.length ? this.onMouseEnter : null}
        onMouseLeave={items.length ? this.onMouseLeave : null}>
        <PrimaryButton variant={{...variant, open}} href={href}>
          {children}
        </PrimaryButton>
        {open &&
          <PrimaryMenuContainer>
            {items}
          </PrimaryMenuContainer>}
      </VBox>
    );
  }

  onMouseEnter = () => {
    this.setState({open: true});
  };

  onMouseLeave = () => {
    if (!this.props.open) {
      this.setState({open: false});
    }
  };
}
