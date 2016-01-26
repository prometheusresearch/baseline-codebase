/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {SearchInput} from 'rex-widget/form';
import * as stylesheet from 'rex-widget/stylesheet';
import * as ui from 'rex-widget/ui';
import {VBox, HBox} from 'rex-widget/layout';
import {DataTable} from 'rex-widget/datatable';
import {port} from 'rex-widget/data';

import {command, Types} from '../execution/Command';
import * as Entity from '../Entity';
import Action from '../Action';
import applyContext from '../applyContext';
import Title from './Title';

export default class Pick extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600
  };

  render() {
    let {
      entity,
      sort,
      onClose,
      context,
      contextTypes,
      searchPlaceholder,
      data,
      actionState: {search}
    } = this.props;
    let title = this.constructor.renderTitle(this.props, this.props.context);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    data = applyContext(data, contextTypes.input, context);
    if (search) {
      data = data.params({'*:__search__': search});
    }
    return (
      <Action noContentWrapper title={title} onClose={onClose}>
        {this.props.search &&
          <SearchInput
            value={search}
            onChange={this.onSearch}
            placeholder={searchPlaceholder}
            />}
        <DataTable
          sort={sort ? {
            valueKey: sort.field,
            asc: sort.asc,
          } : undefined}
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
    this.props.onCommand('default', entity);
  }

  @autobind
  onSearch(search) {
    this.props.setActionState({search});
  }

  static renderTitle({entity, title = `Pick ${entity.name}`}, context) {
    return <Title title={title} entity={entity} context={context} />;
  }

  static getTitle(props) {
    return props.title || `Pick ${props.entity.name}`;
  }

  static commands = {

    @command(Types.ConfigurableEntity())
    default(props, context, entity) {
      if (entity != null) {
        return {...context, [props.entity.name]: entity};
      } else {
        return context;
      }
    }
  };
}
