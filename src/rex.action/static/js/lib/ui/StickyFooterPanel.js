/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind from 'autobind-decorator';
import {addResizeListener, removeResizeListener} from '../vendor/detectElementResize';
import React, {PropTypes} from 'react';
import ReactDOM from 'react-dom';

import * as Stylesheet from 'rex-widget/stylesheet';
import {VBox, HBox} from 'rex-widget/layout';

export default class StickyFooterPanel extends React.Component {

  static propTypes = {
    children: PropTypes.node,
    footer: PropTypes.node,
    stickThreshold: PropTypes.number,
  };

  static defaultProps = {
    stickThreshold: 50,
  };

  static stylesheet = Stylesheet.create({
    Root: {
      Component: VBox,
      flex: 1,
    },
    Content: {
      Component: VBox,
      flex: 1,
    },
    Marker: {
      Component: 'div',
      height: 0,
    }
  });

  constructor(props) {
    super(props);
    this.state = {pinnned: false};
    this._contentRef = null;
    this._contentMarkerRef = null;
  }

  render() {
    let {Root, Content, Footer, Marker} = this.constructor.stylesheet;
    let {children, footer} = this.props;
    let {pinned} = this.state;
    if (footer) {
      footer = React.cloneElement(footer, {variant: {...footer.props.variant, pinned}});
    }
    return (
      <Root>
        <Content ref={this._onContentRef}>
          {children}
          {!pinned && footer}
          <Marker ref={this._onContentMarkerRef} />
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
    if (this._contentRef && this._contentMarkerRef) {
      let contentElem = ReactDOM.findDOMNode(this._contentRef);
      addResizeListener(contentElem, this._onContentResize);
    }
  }

  _uninstallContentResizeDeterctor() {
    if (this._contentRef) {
      let contentElem = ReactDOM.findDOMNode(this._contentRef);
      removeResizeListener(contentElem, this._onContentResize);
    }
  }

  @autobind
  _onContentResize() {
    let contentMarkerBottom = this._contentMarkerElement.getBoundingClientRect().bottom;
    let contentBottom = this._contentElement.getBoundingClientRect().bottom;
    console.log(
      '_onContentResize',
      contentBottom, contentMarkerBottom, this.props.stickThreshold
      );
    if (contentBottom - contentMarkerBottom > this.props.stickThreshold) {
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

  get _contentMarkerElement() {
    return ReactDOM.findDOMNode(this._contentMarkerRef);
  }

  @autobind
  _onContentRef(contentRef) {
    this._contentRef = contentRef;
  }

  @autobind
  _onContentMarkerRef(contentMarkerRef) {
    this._contentMarkerRef = contentMarkerRef;
  }
}
