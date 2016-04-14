/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React, {PropTypes} from 'react';
import {findDOMNode} from 'react-dom';
import cloneElementWithRef from '../cloneElementWithRef';

import * as stylesheet from 'rex-widget/stylesheet';
import {VBox} from 'rex-widget/layout';

import {
  addResizeListener,
  removeResizeListener
} from '../vendor/detectElementResize';

export default class StickyFooterPanel extends React.Component {

  static propTypes = {
    children: PropTypes.node,
    footer: PropTypes.node,
    stickThreshold: PropTypes.number,
  };

  static defaultProps = {
    stickThreshold: 1000,
    addResizeListener: addResizeListener,
    removeResizeListener: removeResizeListener,
  };

  static stylesheet = stylesheet.create({
    Root: {
      Component: VBox,
      flex: 1,
    },
    Content: {
      Component: VBox,
      paddingLeft: 10,
      flex: 1,
    }
  });

  constructor(props) {
    super(props);
    this.state = {pinned: false};
    this._footerRef = null;
    this._contentRef = null;
    this._contentWrapperRef = null;
  }

  render() {
    let {Root, Content} = this.constructor.stylesheet;
    let {children, footer} = this.props;
    let {pinned} = this.state;
    if (footer) {
      footer = cloneElementWithRef(footer, {
        variant: {...footer.props.variant, pinned},
        ref: this._onFooterRef,
      });
    }
    return (
      <Root>
        <Content ref={this._onContentWrapperRef}>
          <div ref={this._onContentRef}>{children}</div>
          {!pinned && footer}
        </Content>
        {pinned && footer}
      </Root>
    );
  }

  componentDidMount() {
    this._installContentResizeDetector();
  }

  componentWillUnmount() {
    this._uninstallContentResizeDeterctor();
  }

  _installContentResizeDetector() {
    if (this._contentRef && this._onContentWrapperRef) {
      this.props.addResizeListener(this._contentElement, this._onContentResize);
      this.props.addResizeListener(this._contentWrapperElement, this._onContentResize);
    }
  }

  _uninstallContentResizeDeterctor() {
    if (this._contentRef && this._onContentWrapperRef) {
      this.props.removeResizeListener(this._contentElement, this._onContentResize);
      this.props.removeResizeListener(this._contentWrapperElement, this._onContentResize);
    }
  }

  @autobind
  _onContentResize() {
    let contentBottom = this._contentElement.getBoundingClientRect().bottom;
    let contentWrapperBottom = this._contentWrapperElement.getBoundingClientRect().bottom;
    if (this._footerRef && !this.state.pinned) {
      let footerHeight = this._footerElement.getBoundingClientRect().height;
      contentWrapperBottom = contentWrapperBottom - footerHeight;
    }
    if (contentWrapperBottom - contentBottom > this.props.stickThreshold) {
      if (this.state.pinned) {
        this.setState({pinned: false});
      }
    } else {
      if (!this.state.pinned) {
        this.setState({pinned: true});
      }
    }
  }

  get _contentElement() {
    return this._contentRef ? findDOMNode(this._contentRef) : null;
  }

  get _contentWrapperElement() {
    return this._contentWrapperRef ? findDOMNode(this._contentWrapperRef) : null;
  }

  get _footerElement() {
    return this._footerRef ? findDOMNode(this._footerRef) : null;
  }

  @autobind
  _onFooterRef(footerRef) {
    this._footerRef = footerRef;
  }

  @autobind
  _onContentRef(contentRef) {
    this._contentRef = contentRef;
  }

  @autobind
  _onContentWrapperRef(contentWrapperRef) {
    this._contentWrapperRef = contentWrapperRef;
  }
}
