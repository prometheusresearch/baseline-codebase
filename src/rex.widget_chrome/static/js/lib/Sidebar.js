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
    var {menu, itemOpen, onToggleItem, ...props} = this.props;

    return (
      <VBox {...this.props}
        flex={1}
        className="ra-AppletPage-sidebar"
        style={this.styleSidebar}>
        <ul className="nav nav-pills nav-stacked">
          {menu.map(item1 =>
            <li className={cx({
                  "ra-AppletPage-sidebar-level1": true,
                  disabled: !item1.permitted
                })}
                role="presentation"
                key={item1.id}>
              <SidebarLink
                onClick={onToggleItem.bind(null, item1.id)}
                icon={appletOpen[item1.id] && item1.permitted ?
                      'menu-down' : 'menu-right'}
                text={item1.title}
                style={{fontWeight: 'bold'}}
                />
              {itemOpen[item1.id] && item1.permitted &&
                <ul className="nav nav-pills nav-stacked">
                  {item1.items.map((item2) =>
                    <li className={cx({
                          "ra-AppletPage-sidebar-level2": true,
                          disabled: !item2.permitted
                        })}
                        style={{marginLeft: 15}}
                        role="presentation"
                        key={item2.id}>
                      <SidebarLink
                        href={item2.url}
                        title={item2.title}
                        text={item2.title}
                        />
                    </li>
                  )}
                </ul>
              }
            </li>
          )}
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
