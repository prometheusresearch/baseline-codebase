/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react'

import Action from '../Action';
import Title from '../actions/Title';
import {autobind} from 'rex-widget/lang';
import * as form from 'rex-widget/form';
import * as layout from 'rex-widget/layout';

export default class ListAction extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      search: {value: null, pattern: null}
    };
  }

  render() {
    let {title, onClose, actions} = this.props;
    let {search} = this.state;
    let extraToolbar = (
      <layout.VBox>
        <form.SearchInput
          debounce={700}
          placeholder="Search action by title or path..."
          value={search.value}
          onChange={this.onSearch}
          />
      </layout.VBox>
    );
    return (
      <Action title={title} onClose={onClose} extraToolbar={extraToolbar}>
        <layout.VBox>
          {actions.map(this.renderInfo)}
        </layout.VBox>
      </Action>
    );
  }

  @autobind
  renderInfo({path, info}) {
    let {search} = this.state;
    if (search.value) {
      if (!match(search.pattern, info.props.info.path) &&
          !match(search.pattern, info.props.info.title, false)) {
        return null;
      }
    }
    info = React.cloneElement(info, {
      onSelect: this.onSelect,
      selected: this.props.context.path === path,
      selectable: true,
    })
    return (
      <layout.VBox key={path} marginBottom={5}>
        {info}
      </layout.VBox>
    );
  }

  @autobind
  onSelect(path, info) {
    let {output} = this.props;
    this.props.onContext({[output]: path});
  }

  @autobind
  onSearch(value) {
    let search = {
      value,
      pattern: new RegExp(value, 'i')
    };
    this.setState({search});
  }

  static renderTitle({title, output}, context) {
    let path = context[output];
    let {Primary, Secondary} = Title.stylesheet;
    return (
      <layout.VBox>
        <Primary>{title}</Primary>
        {path && <Secondary>{path}</Secondary>}
      </layout.VBox>
    );
  }
}

function match(pattern, value, fallback = true) {
  return value ? pattern.test(value) : fallback;
}
