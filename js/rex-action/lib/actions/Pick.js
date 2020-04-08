/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';
import PropTypes from 'prop-types';

import {SearchInput} from 'rex-ui';
import {
  DataTableBase,
  type Row,
  type Pagination,
  type SortDirection,
} from 'rex-widget/datatable';
import {
  useFetchWithHandle,
  type Fetcher,
  type DataSet,
} from 'rex-widget/data';

import type {Entity} from '../model/types';
import {defineCommand, Types} from '../model/Command';
import Action from '../Action';
import Title from './Title';
import * as ContextUtils from '../ContextUtils';
import * as KeyPath from 'rex-widget/KeyPath';

type PickProps = any;

function parseSort(sort: ?string): ?SortDirection {
  if (sort == null) {
    return null;
  }
  try {
    let [key, dir] = sort.split(":");
    let valueKey: KeyPath.keypath = key.split(".");
    let asc = dir === "desc" ? false : true;
    return { valueKey, asc };
  } catch (err) {
    console.error(err);
    return null;
  }
}

function dumpSort(sort: ?SortDirection): ?string {
  if (sort == null) {
    return null;
  }
  let key = KeyPath.normalize(sort.valueKey);
  if (key.length === 0) {
    return null;
  }
  let dir = sort.asc ? "" : ":desc";
  return key.join(".") + dir;
}

export default class Pick extends React.Component<PickProps> {
  _interval: ?IntervalID = null;
  _datatable: ?Instance;

  static propTypes = {
    context: PropTypes.object,
    onCommand: PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600,
  };

  render() {
    let {
      entity,
      sort: initSort,
      onClose,
      context,
      contextTypes,
      searchPlaceholder,
      data,
      actionState: { search, sort },
    } = this.props;
    let title = this.constructor.renderTitle(this.props, this.props.context);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    data = data.params(ContextUtils.contextToParams(context, contextTypes.input));
    if (search) {
      data = data.params({'*:__search__': search});
    }
    let extraToolbar = this.props.search &&
      <SearchInput
        value={search}
        onChange={this.onSearch}
        placeholder={searchPlaceholder}
      />;

    sort = parseSort(sort);
    if (sort == null) {
      sort = initSort
        ? { valueKey: "__sort__", asc: initSort.asc }
        : { valueKey: null, asc: true };
    }

    return (
      <Action noContentWrapper extraToolbar={extraToolbar} title={title}>
        <DataTable
          ref={datatable => (this._datatable = datatable)}
          allowReselect
          data={data}
          columns={this.props.fields}
          sort={sort}
          onSort={this.onSort}
          selected={selected}
          onSelect={this.onSelect}
        />
      </Action>
    );
  }

  onSort = (sort: SortDirection) => {
    // eslint-disable-next-line no-unused-expressions
    this._datatable?.resetPagination();
    this.props.setActionState({ sort: dumpSort(sort) });
  };

  onSelect = (entityId: string, entity: Entity) => {
    this.props.onCommand('default', entity);
  };

  onSearch = (search: ?string) => {
    // eslint-disable-next-line no-unused-expressions
    this._datatable?.resetPagination();
    this.props.setActionState({search});
  };

  refresh = () => {
    // eslint-disable-next-line no-unused-expressions
    this._datatable?.forceRefreshData();
    this.props.refetch();
  };

  componentDidMount() {
    if (this.props.refreshInterval != null) {
      this._interval = setInterval(this.refresh, this.props.refreshInterval * 1000);
    }
  }

  componentWillUnmount() {
    if (this._interval != null) {
      clearInterval(this._interval);
    }
  }

  static renderTitle({ entity, title = `Pick ${entity.name}` }: any, context: any) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props: PickProps) {
    return props.title || `Pick ${props.entity.name}`;
  }
}

defineCommand(Pick, {
  argumentTypes: [Types.ConfigurableEntity()],
  execute(props, context, entity) {
    if (entity != null) {
      return {...context, [props.entity.name]: entity};
    } else {
      return context;
    }
  },
});

type Instance = {
  forceRefreshData: () => void,
  resetPagination: () => void,
};

type DatatableProps = {|
  ...React.ElementConfig<typeof DataTableBase>,
  data: Fetcher<Row[]>,
  sort: SortDirection,
  onSort: SortDirection => void,
|};

let initialPagination = { top: 50, skip: 0 };

let DataTable = React.forwardRef<DatatableProps, ?Instance>(
  (props: DatatableProps, ref) => {
    let { sort, onSort, data, ...rest } = props;
    let [pagination, setPagination] = React.useState(initialPagination);

    data = data.limit(pagination.top, pagination.skip);
    if (sort && sort.valueKey) {
      data = data.sort(sort.valueKey, sort.asc);
    }

    let [dataset, dataHandle] = useFetchWithHandle(data, {
      merge(prevDataset, dataset) {
        if (dataset.length !== 0) {
          dataset = dataset.setHasMore(true);
        }
        if (pagination.skip > 0 && prevDataset.data != null) {
          dataset = dataset.setData(prevDataset.data.concat(dataset.data));
        }
        return dataset;
      },
    });

    React.useImperativeHandle(ref, () => ({
      forceRefreshData: () => {
        dataHandle.refresh();
      },
      resetPagination: () => {
        setPagination(initialPagination);
      },
    }));

    let handleSort = sort => {
      onSort(sort);
      setPagination(initialPagination); // Reset pagination on sort
    };

    let handlePagination = pagination => {
      setPagination(pagination);
    };

    return (
      <DataTableBase
        {...rest}
        pagination={pagination}
        onPagination={handlePagination}
        sort={sort}
        onSort={handleSort}
        data={dataset}
      />
    );
  },
);
