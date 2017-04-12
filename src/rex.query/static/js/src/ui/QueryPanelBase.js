/**
 * @flow
 */

import type {QueryVisTheme} from './Theme';

import React from 'react';
import * as Icon from './Icon';
import {style, css, VBox, HBox} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';
import Label from './Label';
import * as Theme from './Theme';

type QueryPanelBaseProps = {
  title: string,
  theme: QueryVisTheme,
  children: React$Element<*>,
  topBanner?: ?React$Element<*>,
  noBorder?: boolean,
  disableClose?: boolean,
  onClose: () => *,
  onBack: () => *,
};

export default class QueryPanelBase extends React.Component<*, QueryPanelBaseProps, *> {
  static defaultProps = {
    theme: Theme.placeholder,
  };

  render() {
    let {
      title,
      theme,
      children,
      onClose,
      disableClose,
      onBack,
      noBorder,
      topBanner,
    } = this.props;
    let border = !noBorder
      ? css.border(5, theme.backgroundColor)
      : css.border(1, theme.backgroundColor);
    return (
      <QueryPanelBaseRoot style={{borderLeft: border}}>
        {topBanner}
        <QueryPanelBaseWrapper>
          <HBox padding={10} alignItems="center">
            {onBack != null &&
              <HBox paddingRight={10}>
                <ReactUI.QuietButton
                  title="Back"
                  size="small"
                  icon={<Icon.IconArrowLeft />}
                  onClick={onBack}
                />
              </HBox>}
            <HBox
              flexGrow={1}
              flexShrink={1}
              textTransform="capitalize"
              color="#888"
              fontSize="10pt"
              fontWeight={400}>
              <Label label={title} />
            </HBox>
            {!disableClose &&
              <ReactUI.QuietButton
                title="Close"
                size="small"
                icon={<Icon.IconClose />}
                onClick={onClose}
              />}
          </HBox>
          <VBox flexGrow={1}>
            {children}
          </VBox>
        </QueryPanelBaseWrapper>
      </QueryPanelBaseRoot>
    );
  }
}

let QueryPanelBaseRoot = style(VBox, {
  displayName: 'QueryPanelBaseRoot',
  base: {
    flexGrow: 1,
  },
});

let QueryPanelBaseWrapper = style(VBox, {
  displayName: 'QueryPanelBaseWrapper',
  base: {
    flexGrow: 1,
    borderLeft: css.border(1, '#ddd'),
  },
});
