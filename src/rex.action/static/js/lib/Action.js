/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React from 'react';

import {emptyFunction} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';
import * as stylesheet from 'rex-widget/stylesheet';

import {contextTypes} from './ActionContext';
import {
  QuietButton,
  StickyFooterPanel,
  Theme
} from './ui';


export default class Action extends React.Component {

  static propTypes = {
    /**
     * Action title.
     */
    title: React.PropTypes.node,

    /**
     * Content area.
     */
    children: React.PropTypes.node,

    /**
     * Callback which is invoked when close button is clicked.
     */
    onClose: React.PropTypes.func,

    /**
     * Action width.
     */
    width: React.PropTypes.number,

    /**
     * Render callback for footer.
     */
    renderFooter: React.PropTypes.func,
  };

  static defaultProps = {
    renderFooter: emptyFunction
  };

  static contextTypes = contextTypes;

  static stylesheet = stylesheet.create({
    Root: {
      Component: VBox,
      flex: 1,
      overflow: 'hidden',
      flexDirection: 'column-reverse',
    },
    Header: {
      Component: VBox,
      boxShadow: Theme.shadow.light(),
      padding: '20px',
    },
    Content: {
      Component: VBox,
      padding: 20,
    },
    Toolbar: {
      Component: VBox,
      marginTop: 10,
    },
    Footer: {
      padding: '10px 20px',
      flexShrink: 0,
      sticky: {
        zIndex: 1000,
        boxShadow: Theme.shadow.normal(),
      }
    },
    Title: {
      Component: VBox,
      fontWeight: 'bold',
      flex: 1
    },
    ContentContainer: {
      Component: StickyFooterPanel,
      Content: {
        overflow: 'auto',
      }
    },
  });

  render() {
    let {
      Root,
      Header,
      Content,
      ContentContainer,
      Footer,
      Title,
      Toolbar
    } = this.constructor.stylesheet;
    let {
      children, toolbar, extraToolbar,
      title, onClose, noContentWrapper, noHeader,
      contentStyle
    } = this.props;
    toolbar = toolbar || this.context.toolbar;
    let footer = this.props.renderFooter();
    if (footer) {
      footer = <Footer>{footer}</Footer>;
    }
    return (
      <Root>
        {noContentWrapper ?
          children :
          <ContentContainer mode="sticky" footer={footer}>
            <Content style={contentStyle}>{children}</Content>
          </ContentContainer>}
        {!noHeader &&
          <Header>
            <HBox>
              {title && <Title>{title}</Title>}
              {onClose &&
                <QuietButton
                  icon="remove"
                  onClick={onClose}
                  />}
            </HBox>
          {toolbar && <Toolbar>{toolbar}</Toolbar>}
          {extraToolbar && <Toolbar>{extraToolbar}</Toolbar>}
          </Header>}
      </Root>
    );
  }
}
