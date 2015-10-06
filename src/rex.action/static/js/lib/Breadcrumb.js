/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React      from 'react/addons';
import RexWidget  from 'rex-widget';
import {HBox}     from 'rex-widget/lib/Layout';

let BreadcrumbStyle = {
  self: {
    borderTop: '1px solid #d2d2d2',
    borderBottom: '1px solid #d2d2d2',
    height: '100%',
    background: '#fafafa'
  },
  item: {
    top: 0
  },
};

export default class Breadcrumb extends React.Component {

  render() {
    let items = this.props.items.map((item, idx) =>
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
}

let BreadcrumbItemStyle = {
  self: {
    paddingLeft: 13,
    paddingRight: 13,
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

@RexWidget.Hoverable
class BreadcrumbItem extends React.Component {

  static defaultProps = {
    style: {self: undefined}
  };

  render() {
    let {item, onClick, hover, style, active, ...props} = this.props;
    let styleSelf = {
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
  }
}
