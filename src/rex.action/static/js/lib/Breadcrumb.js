/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react/addons');
var RexWidget           = require('rex-widget');
var {VBox, HBox}        = RexWidget.Layout;

var BreadcrumbStyle = {
  self: {
    borderTop: '1px solid #d2d2d2',
    height: '100%',
    background: '#fafafa'
  },
  item: {
    top: 1
  },
};

var Breadcrumb = React.createClass({

  render() {
    var items = this.props.items.map((item, idx) =>
      <BreadcrumbItem
        key={idx}
        active={this.props.active.indexOf(item.id) !== -1}
        style={{self: BreadcrumbStyle.item}}
        item={item}
        onClick={this.props.onClick}
        />
    );
    return (
      <HBox style={BreadcrumbStyle.self}>
        {items}
      </HBox>
    );
  }
});

var BreadcrumbItemStyle = {
  self: {
    paddingLeft: 15,
    paddingRight: 15,
    height: '100%',
    alignItems: 'center',
    fontSize: '90%',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderRight: '1px solid #eaeaea',
    background: '#f9f9f9',
    color: '#aaaaaa'
  },
  icon: {
    top: -1
  },
  onHover: {
    self: {
      color: '#333'
    }
  },
  onActive: {
    self: {
      cursor: 'default',
      background: '#fefefe',
      fontWeight: 'bold',
      color: '#333'
    }
  }
};

var BreadcrumbItem = React.createClass({

  render() {
    var {item, onClick, hover, style, active, ...props} = this.props;
    var styleSelf = {
      ...BreadcrumbItemStyle.self,
      ...style.self,
      ...(hover && BreadcrumbItemStyle.onHover.self),
      ...(active && BreadcrumbItemStyle.onActive.self)
    }
    return (
      <HBox {...props} style={styleSelf} onClick={onClick.bind(null, item.id)}>
        {item.icon &&
          <RexWidget.Icon
            name={item.icon}
            style={{...BreadcrumbItemStyle.icon, marginRight: item.title ? 7 : 0}}
            />}
        {item.title}
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      style: {self: undefined}
    };
  }
});

BreadcrumbItem = RexWidget.Hoverable(BreadcrumbItem);

module.exports = Breadcrumb;
