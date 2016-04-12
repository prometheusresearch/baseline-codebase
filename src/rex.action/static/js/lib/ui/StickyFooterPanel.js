/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';

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
    stickThreshold: 50,
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
      flex: 1,
    }
  });

  constructor(props) {
    super(props);
    this.state = {pinned: false};
    this._contentRef = null;
    this._contentWrapperRef = null;
  }

  render() {
    let {Root, Content} = this.constructor.stylesheet;
    let {children, footer} = this.props;
    let {pinned} = this.state;
    if (footer) {
      footer = React.cloneElement(footer, {variant: {...footer.props.variant, pinned}});
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
    return ReactDOM.findDOMNode(this._contentRef);
  }

  get _contentWrapperElement() {
    return ReactDOM.findDOMNode(this._contentWrapperRef);
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
