/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {Action} from 'rex-action';
import * as layout from 'rex-widget/layout';
import * as ui from 'rex-widget/ui';

import * as ListUtils from './ListUtils';
import QueryResultDataTable from './QueryResultDataTable';
import QueryAction from './QueryAction';

@QueryAction
export default class FilterDataset extends React.Component {
  static defaultProps = {
    icon: 'filter'
  };

  render() {
    let {title, filterElements, query, onQueryUpdate, db} = this.props;
    let columns = ListUtils.columnsFromQuery(query);
    filterElements = filterElements.map(element =>
      React.cloneElement(element, {
        query,
        key: element.props.expression,
        onQueryUpdate
    }));
    return (
      <Action title={title} noContentWrapper>
        <layout.HBox flex={1}>
          <ui.Panel minWidth={250} maxWidth={500} flex={1} padding={10} overflow="auto">
            {filterElements}
          </ui.Panel>
          <layout.VBox flex={4} paddingTop={5}>
            <QueryResultDataTable
              data={db}
              columns={columns}
              />
          </layout.VBox>
        </layout.HBox>
      </Action>
    );
  }
}
