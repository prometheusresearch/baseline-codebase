/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import resizeDetector       from 'element-resize-detector';
import emptyFunction        from 'empty/functionThatReturnsNull';
import React                from 'react';

import {VBox, HBox}         from 'rex-widget/layout';
import * as Stylesheet      from 'rex-widget/stylesheet';
import * as CSS             from 'rex-widget/css';

import {
  QuietButton,
  StickyFooterPanel,
  Theme
} from './ui';


@Stylesheet.attach
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

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      flex: 1,
    },
    Header: {
      Component: HBox,
      boxShadow: Theme.shadow.normal(),
      padding: '20px 10px',
    },
    Content: {
      Component: VBox,
      flex: 1,
      padding: 10,
    },
    Footer: {
      padding: 5,
      pinned: {
        zIndex: 1000,
        background: Theme.color.primary.background,
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
    let {Root, Header, Content, ContentContainer, Footer, Title} = this.stylesheet;
    let {children, title, onClose, noContentWrapper} = this.props;
    let footer = this.props.renderFooter();
    if (footer) {
      footer = <Footer>{footer}</Footer>;
    }
    return (
      <Root>
        <Header>
          {title && <Title>{title}</Title>}
          {onClose &&
            <QuietButton
              icon="remove"
              onClick={onClose}
              />}
        </Header>
        <ContentContainer footer={footer}>
          {noContentWrapper ?
            children :
            <Content>{children}</Content>}
        </ContentContainer>
      </Root>
    );
  }
}
