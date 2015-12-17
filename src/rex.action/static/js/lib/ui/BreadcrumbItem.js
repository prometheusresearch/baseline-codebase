/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react';

import {Icon} from 'rex-widget/ui';
import {HBox} from 'rex-widget/layout';
import * as Stylesheet from 'rex-widget/stylesheet';

@Stylesheet.attach
export default class BreadcrumbItem extends React.Component {

  static propTypes = {
    item: PropTypes.array,
    hover: PropTypes.bool,
    style: PropTypes.object,
    onClick: PropTypes.func,
    active: PropTypes.bool,
  };

  static stylesheet = Stylesheet.create({
    Self: {
      Component: HBox,
      top: 0,
      padding: '0 13px',
      height: '100%',
      alignItems: 'center',
      fontSize: '90%',
      fontWeight: 'bold',
      cursor: 'pointer',
      borderRight: '1px solid #eaeaea',
      background: '#f9f9f9',
      color: '#aaaaaa',
      hover: {
        color: '#333'
      },
      active: {
        cursor: 'default',
        background: '#fefefe',
        fontWeight: 'bold',
        color: '#333'
      }
    },
    Icon: {
      Component: Icon,
      top: -1,
      hasTitle: {
        marginRight: 7,
      }
    },
  });

  render() {
    let {Self, Icon} = this.stylesheet;
    let {item, onClick, style, active, ...props} = this.props;
    return (
      <Self {...props} variant={{active}} onClick={onClick.bind(null, item.id)}>
        {item.icon &&
          <Icon name={item.icon} variant={{hasTitle: item.title}} />}
        {item.title}
      </Self>
    );
  }
}
