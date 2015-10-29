/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import resizeDetector       from 'element-resize-detector';
import emptyFunction        from 'empty/functionThatReturnsNull';
import React                from 'react';
import * as Stylesheet      from '@prometheusresearch/react-stylesheet';
import * as CSS             from '@prometheusresearch/react-stylesheet/css';
import {VBox, HBox}         from '@prometheusresearch/react-box';
import RexWidget            from 'rex-widget';

import {
  QuietButton,
  StickyFooterPanel,
  Theme
} from './ui';


@Stylesheet.styleable
export default class Action extends React.Component {

  static propTypes = {
    /**
     * Action title.
     */
    title: React.PropTypes.string,

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

  static stylesheet = Stylesheet.createStylesheet({
    Root: {
      Component: VBox,
      flex: 1,
    },
    Header: {
      Component: HBox,
      boxShadow: Theme.shadow.normal(),
      padding: 10,
    },
    Content: {
      padding: 10,
    },
    Footer: {
      padding: 5,
      pinned: {
        boxShadow: Theme.shadow.normal(),
      }
    },
    Title: {
      Component: VBox,
      flex: 1
    }
  });

  render() {
    let {Root, Header, Content, Footer, Title} = this.stylesheet;
    let {children, title, onClose, noContentWrapper} = this.props;
    let footer = this.props.renderFooter();
    if (footer) {
      footer = <Footer>{footer}</Footer>;
    }
    return (
      <Root>
        <Header>
          {title && <Title><h4>{title}</h4></Title>}
          {onClose &&
            <QuietButton
              icon="remove"
              onClick={onClose}
              />}
        </Header>
        <StickyFooterPanel footer={footer}>
          {noContentWrapper ?
            children :
            <Content>{children}</Content>}
        </StickyFooterPanel>
      </Root>
    );
  }
}
