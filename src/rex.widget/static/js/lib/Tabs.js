/**
 * @copyright 2014, Prometheus Research, LLC
 */

import autobind           from 'autobind-decorator';
import React, {PropTypes} from 'react';
import cx                 from 'classnames';
import {Box, HBox}        from './Layout';

/**
 * @deprecated
 * @public
 */
export default class Tabs extends React.Component {

  static propTypes = {
    tabs: PropTypes.node,
    children: PropTypes.node,
    size: PropTypes.number,
    className: PropTypes.string,
    active: PropTypes.string,
    onActive: PropTypes.func,
    buttonsStyle: PropTypes.object,
    buttonsPosition: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  };

  static defaultProps = {
    size: 1,
    buttonsPosition: 'top',
    buttonsStyle: 'tabs'
  };

  render() {
    let  {
      tabs, children, size, className, active,
      buttonsStyle, buttonsPosition, ...props
    } = this.props;
    tabs = tabs || children;
    active = active || tabs[0].props.id;
    let buttons = tabs.map(tab =>
      <li
        key={tab.props.id}
        role="presentation"
        className={cx({
          active: tab.props.id === active,
          disabled: tab.props.disabled
        })}>
        <a
          href="#"
          onClick={this.onClick.bind(null, tab.props.id)}>
          {tab.props.title || tab.props.id}
        </a>
      </li>
    );
    let tab = tabs.filter(tab => tab.props.id === active)[0];
    className = cx('rw-Tabs', className);
    let tabsElement = (
      <Box className={`rw-Tabs--${buttonsPosition}Position`} key="tabs">
        <ul className={`rw-Tabs__buttons nav nav-${buttonsStyle}`}>
          {buttons}
        </ul>
      </Box>
    );
    let content = (
      <Box className="rw-Tabs__children tab-content" key="content" scrollable size={1}>
        {tab}
      </Box>
    );
    let Wrapper = buttonsPosition === 'left' || buttonsPosition === 'right' ?
      HBox : Box;
    return (
      <Wrapper {...props} size={size} className={className}>
        {buttonsPosition === 'top'    && [tabsElement, content]}
        {buttonsPosition === 'right'  && [content, tabsElement]}
        {buttonsPosition === 'bottom' && [content, tabsElement]}
        {buttonsPosition === 'left'   && [tabsElement, content]}
      </Wrapper>
    );
  }

  @autobind
  onClick(id, e) {
    e.preventDefault();
    this.props.onActive(id);
  }
}
