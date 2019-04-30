import * as React from 'react';
import PropTypes from 'prop-types';
import * as ReactDOM from 'react-dom';
import createTapListener from 'teeny-tap';
import specialAssign from './specialAssign';

const checkedProps = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  tag: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

export default class Menu extends React.Component {
  props: {
    children?: React.Element<*>,
    tag: Function | string,
  };

  static defaultProps = {
    tag: 'div',
  };

  static contextTypes = {
    ambManager: PropTypes.object.isRequired,
  };

  componentWillMount() {
    this.context.ambManager.menu = this;
  }

  componentDidUpdate() {
    let ambManager = this.context.ambManager;
    if (ambManager.isOpen && !this.tapListener) {
      this.addTapListener();
    } else if (!ambManager.isOpen && this.tapListener) {
      this.tapListener.remove();
      delete this.tapListener;
    }

    if (!ambManager.isOpen) {
      // Clear the ambManager's items, so they
      // can be reloaded next time this menu opens
      ambManager.clearItems();
    }
  }

  componentWillUnmount() {
    if (this.tapListener) this.tapListener.remove();
    this.context.ambManager.destroy();
  }

  addTapListener = () => {
    let el = ReactDOM.findDOMNode(this);
    if (!el) return;
    let doc = el.ownerDocument;
    if (!doc) return;
    this.tapListener = createTapListener(doc.documentElement, this.handleTap);
  };

  handleTap = event => {
    if (ReactDOM.findDOMNode(this).contains(event.target)) return;
    if (ReactDOM.findDOMNode(this.context.ambManager.button).contains(event.target))
      return;
    this.context.ambManager.closeMenu();
  };

  render() {
    let props = this.props;
    let ambManager = this.context.ambManager;

    let childrenToRender = (function() {
      if (typeof props.children === 'function') {
        return props.children({isOpen: ambManager.isOpen});
      }
      if (ambManager.isOpen) return props.children;
      return false;
    })();

    if (!childrenToRender) return false;

    let menuProps = {
      onKeyDown: ambManager.handleMenuKey,
      role: 'menu',
      onBlur: ambManager.handleBlur,
    };

    specialAssign(menuProps, props, checkedProps);

    return React.createElement(props.tag, menuProps, childrenToRender);
  }
}
