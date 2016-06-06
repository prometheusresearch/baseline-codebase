import React from 'react';
import {Action} from 'rex-action';
import {Link} from 'rex-widget';
import {Preloader, SuccessButton} from 'rex-widget/ui';
import {HBox, VBox} from 'rex-widget/layout';
import {Fetch, DataSet} from 'rex-widget/data';
import autobind from 'autobind-decorator';
import {DataTableBase} from 'rex-widget/datatable';
import {SearchInput} from 'rex-widget/form';
import Title from 'rex-action/lib/actions/Title';

export default class PickTableWizard extends React.Component {

  render() {
    let {title, onClose, tables} = this.props;
    let {filter = ''} = this.props.actionState;
    let data = DataSet.fromData(tables.filter(
      (table) => table.title.indexOf(filter) != -1
    ));
    return (
      <Action title={title} onClose={onClose} noContentWrapper>
        <VBox flex={1}>
          <HBox padding={5}>
            <SearchInput
              debounce={500}
              onChange={this.onChangeFilter}
              value={filter}
              />
          </HBox>
          <VBox flex={1}>
            <DataTableBase
              flex={1}
              columns={[
                {valueKey: ['title'], label: 'Table'},
              ]}
              data={data}
              onSelect={this.onSelect}
              />
          </VBox>
        </VBox>
      </Action>
    );
  }

  @autobind
  onSelect(id) {
    this.props.onContext({
      table: id
    })
  }

  @autobind
  onChangeFilter(value) {
    this.props.setActionState({filter: value});
  }

  static renderTitle(props, context) {
    let {title} = props;
    let {Primary, Secondary} = Title.stylesheet;
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
