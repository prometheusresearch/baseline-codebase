/**
 * @copyright 2016-present, Prometheus Research, LLC
 * @flow
 */

import * as React from 'react';

import {SearchInput} from 'rex-widget/form';
import {DataTable} from 'rex-widget/datatable';

import type {Entity} from '../model/types';
import {defineCommand, Types} from '../model/Command';
import Action from '../Action';
import Title from './Title';
import * as ContextUtils from '../ContextUtils';

export default class Pick extends React.Component {
  _interval: ?number = null;

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600,
  };

  render() {
    let {
      entity,
      sort: sortSpec,
      onClose,
      context,
      contextTypes,
      searchPlaceholder,
      data,
      actionState: {search},
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
    let sort = sortSpec ? {valueKey: '__sort__', asc: sortSpec.asc} : undefined;
    return (
      <Action
        noContentWrapper
        extraToolbar={extraToolbar}
        title={title}
        onClose={onClose}>
        <DataTable
          allowReselect
          sort={sort}
          data={data}
          columns={this.props.fields}
          selected={selected}
          onSelect={this.onSelect}
        />
      </Action>
    );
  }

  onSelect = (entityId: string, entity: Entity) => {
    this.props.onCommand('default', entity);
  };

  onSearch = (search: string) => {
    this.props.setActionState({search});
  };

  refresh = () => {
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

  static renderTitle({entity, title = `Pick ${entity.name}`}, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
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
