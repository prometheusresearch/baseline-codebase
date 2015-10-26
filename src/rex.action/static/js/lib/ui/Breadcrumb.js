/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React, {PropTypes} from 'react/addons';
import {HBox}             from '@prometheusresearch/react-box';
import Stylesheet         from '@prometheusresearch/react-stylesheet';
import BreadcrumbItem     from './BreadcrumbItem';

@Stylesheet
export default class Breadcrumb extends React.Component {

  static propTypes = {
    items: PropTypes.array,
    active: PropTypes.string,
    onClick: PropTypes.func,
  };

  static stylesheet = {
    Self: {
      Component: HBox,
      borderTop: '1px solid #d2d2d2',
      borderBottom: '1px solid #d2d2d2',
      height: '100%',
      background: '#fafafa'
    },
    Item: {
      Component: BreadcrumbItem,
      Self: {
        top: 0
      }
    },
  };

  render() {
    let {Self, Item} = this.stylesheet;
    let items = this.props.items.map((item, idx) =>
      <Item
        key={idx}
        active={this.props.active.indexOf(item.id) !== -1}
        item={item}
        onClick={this.props.onClick}
        />
    );
    return <Self>{items}</Self>;
  }
}
