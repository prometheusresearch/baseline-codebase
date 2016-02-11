/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import Action from '../Action';
import {autobind, emptyFunction} from 'rex-widget/lang';
import {Fetch} from 'rex-widget/data';
import Title from '../actions/Title';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

@Fetch(function fetchAction({context, action, input}) {
  let path = context[input];
  return {
    action: action.params({path}).asTransitionable()
  };
})
export default class ViewAction extends React.Component {

  render() {
    let {fetched: {action}} = this.props;
    return (
      <Action noContentWrapper noHeader>
        {action.updating ?
          <ui.Preloader /> :
          React.cloneElement(action.data, {onSelect: this.onSelect})}
      </Action>
    );
  }

  @autobind
  onSelect(path) {
    if (path) {
      let {output} = this.props;
      this.props.onContext({[output]: path});
    }
  }

  static renderTitle({title, input}, context) {
    let path = context[input];
    let {Primary, Secondary} = Title.stylesheet;
    return (
      <layout.VBox>
        <Primary>{title}</Primary>
        {path && <Secondary>{path}</Secondary>}
      </layout.VBox>
    );
  }
}
