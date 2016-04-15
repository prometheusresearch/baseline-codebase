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
    mode: PropTypes.oneOf(['sticky', 'floating']),

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
    Content: 'div',
    ContentWrapper: {
      Component: VBox,
      paddingLeft: 10,
      flex: 1,
    }
  });

  constructor(props) {
    super(props);
    this.state = {sticky: this.props.mode === 'sticky'};
    this._footerRef = null;
    this._contentRef = null;
    this._contentWrapperRef = null;
  }

  render() {
    let {Root, Content, ContentWrapper} = this.constructor.stylesheet;
    let {children, footer, mode} = this.props;
    let {sticky} = this.state;
    if (footer) {
      footer = cloneElementWithRef(footer, {
        variant: {...footer.props.variant, sticky},
        ref: this._onFooterRef,
      });
    }
    return (
      <Root>
        <ContentWrapper ref={this._onContentWrapperRef}>
          {mode !== undefined ?
            children :
            <Content ref={this._onContentRef}>{children}</Content>}
          {!sticky && footer}
        </ContentWrapper>
        {sticky && footer}
      </Root>
    );
  }

  componentDidMount() {
    if (this.props.mode === undefined) {
      this._installContentResizeDetector();
    }
  }

  componentWillUnmount() {
    if (this.props.mode === undefined) {
      this._uninstallContentResizeDeterctor();
    }
  }

  componentWillReceiveProps({mode}) {
    if (mode !== this.props.mode) {
      this.setState({sticky: mode === 'sticky'});
    }
  }

  componentDidUpdate({mode}) {
    if (mode !== this.props.mode) {
      if (this.props.mode === undefined) {
        this._installContentResizeDetector();
        this._onContentResize();
      } else {
        this._uninstallContentResizeDeterctor();
      }
    }
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
    if (this._footerRef && !this.state.sticky) {
      let footerHeight = this._footerElement.getBoundingClientRect().height;
      contentWrapperBottom = contentWrapperBottom - footerHeight;
    }
    if (contentWrapperBottom - contentBottom > this.props.stickThreshold) {
      if (this.state.sticky) {
        this.setState({sticky: false});
      }
    } else {
      if (!this.state.sticky) {
        this.setState({sticky: true});
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
