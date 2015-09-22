/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind                         from 'autobind-decorator';
import ReactStylesheet                  from '@prometheusresearch/react-stylesheet';
import {HBox, VBox}                     from '@prometheusresearch/react-box';
import Icon                             from 'rex-widget/lib/Icon';
import {getIcon, renderTitle, getTitle} from './actions';

@ReactStylesheet
export default class ActionButton extends React.Component {

  static stylesheet = {
    Self: HBox,
    Icon: Icon,
  };

  render() {
    let {position, active, showContext, ...props} = this.props;
    let icon = getIcon(position.element);
    let title = showContext ?
      renderTitle(position) :
      getTitle(position.element);
    let {Self, Icon} = this.stylesheet;
    return (
      <Self {...props}
        state={{active}}
        Component="a"
        aria-pressed={active}
        role="button"
        onClick={this._onClick}>
        {icon && <Icon name={icon} />}
        {title}
      </Self>
    );
  }

  @autobind
  _onClick() {
    this.props.onClick(this.props.position.keyPath);
  }
}

