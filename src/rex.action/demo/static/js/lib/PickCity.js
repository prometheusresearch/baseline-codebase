
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

export default class PickCity extends React.Component {

  render() {
    let {title, onClose, cities} = this.props;
    let {filter = ''} = this.props.actionState;
    let data = DataSet.fromData(cities.filter(
      (city) => city.name.indexOf(filter) != -1
    ));
    return (
      <Action title={title} onClose={onClose}>
        <VBox flex="1">
          <HBox>
            <SearchInput
              debounce={500}
              onChange={this.onChangeFilter}
              value={filter}
              />
          </HBox>
          <DataTableBase
            columns={[
              {valueKey: ['name'], label: 'City'},
              {valueKey: ['population'], label: 'Population'},
            ]}
            data={data}
            onSelect={this.onSelect}
            />
        </VBox>
      </Action>
    );
  }

  @autobind
  onSelect(id) {
    let selected = this.props.cities.filter(
      (city) => city.id == id
    )[0];
    this.props.onContext({
      city: selected.name
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
          {context.city && <small>{context.city}</small>}
        </Primary>
      </VBox>
    );
  }

}
