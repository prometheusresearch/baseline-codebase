/**
 * @flow
 */

import color from 'color';
import React from 'react';
import CloseIcon from 'react-icons/lib/fa/close';
import {VBox, HBox} from '@prometheusresearch/react-box';
import {style} from 'react-stylesheet';
import * as css from 'react-stylesheet/css';
import * as ReactUI from '@prometheusresearch/react-ui';

type QueryPanelBaseProps = {
  title: string;
  attach: 'left' | 'right';
  theme: {background: string; color: string};
  children: React$Element<*>;
  onClose: () => *;
};

let QueryPanelBaseRoot = style(VBox, {
  base: {
    borderLeft: css.border(1, '#ddd'),
    borderRight: css.border(1, '#ddd'),
  },
});

let QueryPanelBaseTitle = style(HBox, {
  displayName: 'QueryPanelBaseTitle',
  base: {
    fontWeight: 300,
  }
});

export default class QueryPanelBase extends React.Component<*, QueryPanelBaseProps, *> {

  static defaultProps = {
    attach: 'left',
    theme: {background: '#eee', color: 'inherit'},
  };

  render() {
    let {attach, title, theme, children, onClose} = this.props;
    let border = css.border(5, color(theme.background).darken(0.2).rgbString());
    return (
      <QueryPanelBaseRoot
        grow={1}
        style={{
          borderLeft: attach === 'left' ? border : undefined,
          borderRight: attach === 'right' ? border : undefined,
        }}>
        <HBox padding={10}>
          <QueryPanelBaseTitle grow={1}>
            {title}
          </QueryPanelBaseTitle>
          <ReactUI.QuietButton
            size="small"
            icon={<CloseIcon />}
            onClick={onClose}
            />
        </HBox>
        <VBox grow={1}>
          {children}
        </VBox>
      </QueryPanelBaseRoot>
    );
  }
}
