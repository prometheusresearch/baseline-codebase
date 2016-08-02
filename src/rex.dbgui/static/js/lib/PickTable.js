import React from 'react';
import {Action} from 'rex-action';
import {VBox} from 'rex-widget/layout';
import {DataSet} from 'rex-widget/data';
import autobind from 'autobind-decorator';
import {DataTableBase} from 'rex-widget/datatable';
import {SearchInput} from 'rex-widget/form';
import Title from 'rex-action/lib/actions/Title';

export default class PickTable extends React.Component {

  render() {
    let {title, tables, context} = this.props;
    let {filter = ''} = this.props.actionState;
    let data = DataSet.fromData(tables.filter(
      (table) => table.title.indexOf(filter || '') != -1
    ));
    let search = (
      <SearchInput
        debounce={500}
        onChange={this.onChangeFilter}
        value={filter}
      />
    );
    return (
      <Action 
        title={title}
        extraToolbar={search}
        noContentWrapper>
        <DataTableBase
          flex={1}
          columns={[
            {valueKey: ['title'], label: 'Table'},
          ]}
          data={data}
          selected={context.table}
          onSelect={this.onSelect}
          />
      </Action>
    );
  }

  @autobind
  onSelect(id) {
    this.props.onContext({
      table: id
    });
  }

  @autobind
  onChangeFilter(value) {
    this.props.setActionState({filter: value});
  }

  static renderTitle(props, context) {
    let {title} = props;
    let {Primary} = Title.stylesheet;
    return (
      <VBox>
        <Primary>
          {title}
          {context.table && <small>{context.table}</small>}
        </Primary>
      </VBox>
    );
  }
}
