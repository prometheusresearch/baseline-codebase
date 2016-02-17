/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';

import {autobind} from 'rex-widget/lang';
import {SearchInput} from 'rex-widget/form';
import {DataTable} from 'rex-widget/datatable';

import {command, Types} from '../execution/Command';
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
    let extraToolbar = (
      this.props.search &&
        <SearchInput
          value={search}
          onChange={this.onSearch}
          placeholder={searchPlaceholder}
          />
    );
    return (
      <Action
        noContentWrapper
        extraToolbar={extraToolbar}
        title={title}
        onClose={onClose}>
        <DataTable
          allowReselect
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
