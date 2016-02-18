/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {autobind} from 'rex-widget/lang';
import {SearchInput} from 'rex-widget/form';
import {DataTable} from 'rex-widget/datatable';


export default class DictionaryPick extends React.Component {
  static defaultProps = {
    icon: 'list'
  };

  render() {
    let {title, onClose, context, data, actionState: {search}} = this.props;
    let targetContext = this.constructor.targetContext;
    let selected = context[targetContext] ? context[targetContext] : undefined;

    let extraToolbar = (
      <SearchInput
        value={search}
        onChange={this.onSearch}
        />
    );

    data = data.params({'mart': context.mart});
    if (this.constructor.contextParams) {
      this.constructor.contextParams.forEach((param) => {
        data = data.params({[':' + param]: context[param]});
      });
    }
    if (search) {
      data = data.params({'*:__search__': search});
    }

    return (
      <Action
        extraToolbar={extraToolbar}
        noContentWrapper
        title={title}
        onClose={onClose}>
        <DataTable
          allowReselect
          data={data}
          columns={this.props.fields}
          selected={selected}
          onSelect={this.onSelect}
          />
      </Action>
    );
  }

  @autobind
  onSelect(entityId, entity) {
    this.props.onContext({
      [this.constructor.targetContext]: entityId
    });
  }

  @autobind
  onSearch(search) {
    this.props.setActionState({search});
  }
}

