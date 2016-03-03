/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {Action} from 'rex-action';
import {autobind} from 'rex-widget/lang';
import {VBox, HBox} from 'rex-widget/layout';
import {Panel} from 'rex-widget/ui';
import {SearchInput} from 'rex-widget/form';

import * as ListUtils from './ListUtils';
import QueryResultDataTable from './QueryResultDataTable';
import QueryAction from './QueryAction';
import QueryFieldSelector from './QueryFieldSelector';

@QueryAction
export default class ChooseColumns extends React.Component {

  constructor(props) {
    super(props);
    this.state = {search: {value: null, pattern: null}};
  }

  render() {
    let {title, query, onQueryUpdate, allFields: fields, db} = this.props;
    let {search} = this.state;
    let columns = ListUtils.columnsFromQuery(query);
    if (search.pattern) {
      fields = fields.filter(field =>
        search.pattern.exec(field.title) ||
        search.pattern.exec(field.expression));
    }
    return (
      <Action title={title} noContentWrapper>
        <HBox flex={1}>
          <Panel minWidth={250} maxWidth={500} flex={1} padding={10}>
            <SearchInput
              value={search.value}
              onChange={this.onSearch}
              />
            <VBox overflow="auto" flex={1}>
              <QueryFieldSelector
                query={query}
                onQueryUpdate={onQueryUpdate}
                fields={fields}
                />
            </VBox>
          </Panel>
          <VBox flex={4} paddingTop={5}>
            <QueryResultDataTable
              data={db}
              columns={columns}
              />
          </VBox>
        </HBox>
      </Action>
    );
  }

  @autobind
  onSearch(value) {
    let pattern = value === null ? null : new RegExp(value, 'ig');
    this.setState({search: {value, pattern}});
  }
}
