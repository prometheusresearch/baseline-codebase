/**
 * @copyright 2015-present, Prometheus Research, LLC
 * @flow
 */

import invariant from 'invariant';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {VBox, Element} from 'react-stylesheet';

import cloneElementWithRef from '../cloneElementWithRef';
import {addResizeListener, removeResizeListener} from '../vendor/detectElementResize';

type Props = {
  mode?: 'sticky' | 'floating',
  footer?: React$Element<*>,
  children?: React$Element<*>,
  stickThreshold: number,
  addResizeListener: (element: HTMLElement, listener: Function) => void,
  removeResizeListener: (element: HTMLElement, listener: Function) => void,
  contentWrapperStyle?: Object,
};

type State = {
  sticky: boolean,
};

export default class StickyFooterPanel extends React.Component {
  props: Props;

  state: State = {sticky: this.props.mode === 'sticky'};

  _footerRef: ?React.Component<any, any, any> = null;
  _contentRef: ?React.Component<any, any, any> = null;
  _contentWrapperRef: ?React.Component<any, any, any> = null;

  static defaultProps = {
    stickThreshold: 50,
    addResizeListener: addResizeListener,
    removeResizeListener: removeResizeListener,
  };

  render() {
    let {children, footer, mode, contentWrapperStyle} = this.props;
    let {sticky} = this.state;
    if (footer) {
      footer = cloneElementWithRef(footer, {
        variant: {...footer.props.variant, sticky},
        ref: this._onFooterRef,
      });
    }
    return (
      <VBox flexGrow={1}>
        <VBox
          paddingLeft={10}
          flexGrow={1}
          ref={this._onContentWrapperRef}
          style={contentWrapperStyle}>
          {mode !== undefined
            ? children
            : <Element ref={this._onContentRef}>{children}</Element>}
          {!sticky && footer}
        </VBox>
        {sticky && footer}
      </VBox>
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

  componentWillReceiveProps({mode}: Props) {
    if (mode !== this.props.mode) {
      this.setState({sticky: mode === 'sticky'});
    }
  }

  componentDidUpdate({mode}: Props) {
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
    if (this._contentRef != null && this._contentWrapperRef != null) {
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

  _onContentResize = () => {
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
  };

  get _contentElement(): HTMLElement {
    invariant(this._contentRef != null, 'Invalid component state');
    return (ReactDOM.findDOMNode(this._contentRef): any);
  }

  get _contentWrapperElement(): HTMLElement {
    invariant(this._contentWrapperRef != null, 'Invalid component state');
    return (ReactDOM.findDOMNode(this._contentWrapperRef): any);
  }

  get _footerElement(): HTMLElement {
    invariant(this._footerRef != null, 'Invalid component state');
    return (ReactDOM.findDOMNode(this._footerRef): any);
  }

  _onFooterRef = (footerRef: React.Component<*, *, *>) => {
    this._footerRef = footerRef;
  };

  _onContentRef = (contentRef: React.Component<any, any, any>) => {
    this._contentRef = contentRef;
  };

  _onContentWrapperRef = (contentWrapperRef: React.Component<any, any, any>) => {
    this._contentWrapperRef = contentWrapperRef;
  };
}
