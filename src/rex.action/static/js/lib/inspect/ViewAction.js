/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import Action from '../Action';
import {autobind, emptyFunction} from 'rex-widget/lang';
import {Fetch} from 'rex-widget/data';
import * as ui from 'rex-widget/ui';
import * as layout from 'rex-widget/layout';

@Fetch(function fetchAction({context: {path}, action}) {
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
      this.props.onContext({path});
    }
  }
}
