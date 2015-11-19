/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                                 = require('react');
var RexWidget                             = require('rex-widget');
var {Icon, emptyFunction, classNames: cx} = RexWidget;
var {VBox}                                = RexWidget.Layout;

var Sidebar = React.createClass({

  styleSidebar: {
    position: 'absolute',
    zIndex: 1000,
    top: 50,
    height: 'calc(100% - 50px)',
    background: 'white',
    minWidth: '250px',
    boxShadow: '1px 0 5px 0px #ddd',
    overflow: 'auto'
  },

  render() {

    return (
      <VBox {...this.props}
        size={1}
        className="ra-AppletPage-sidebar"
        style={this.styleSidebar}>
        <ul className="nav nav-pills nav-stacked">
          <li>Item 1</li> 
          <li>Item 2</li> 
        </ul>
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      onClickOutside: emptyFunction
    };
  },

  componentDidMount() {
    setTimeout(() => {
      window.addEventListener('click', this._onWindowClick);
    });
  },

  componentWillUnmount() {
    window.removeEventListener('click', this._onWindowClick);
  },

  _onWindowClick(e) {
    if (!insideOrIsElement(e.target, this.getDOMNode())) {
      this.props.onClickOutside()
    }
  }
});

function insideOrIsElement(element, container) {
  if (element === container) {
    return true;
  }
  while (element.parentNode) {
    element = element.parentNode;
    if (element === container) {
      return true;
    }
  }
  return false;
}

var SidebarLink = React.createClass({

  styleIcon: {
    marginRight: 7
  },

  render() {
    var {icon, text, ...props} = this.props;
    return (
      <a {...props}>
        {icon &&
          <Icon
            name={icon}
            style={this.styleIcon}
            />}
        {text}
      </a>
    );
  }
});

module.exports = Sidebar;
