/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import React                from 'react';

import RexWidget            from 'rex-widget';
import * as Stylesheet      from 'rex-widget/stylesheet';
import {VBox, HBox}         from 'rex-widget/layout';
import {DataTable}          from 'rex-widget/datatable';
import {port}               from 'rex-widget/data';

import {command, Types}     from '../execution/Command';
import * as Entity          from '../Entity';
import Action               from '../Action';
import applyContext         from '../applyContext';
import Title                from './Title';

@Stylesheet.attach
export default class Pick extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600
  };

  static stylesheet = Stylesheet.create({
    Search: {
      Component: RexWidget.SearchInput,
      borderRadius: 0,
      border: 'none',
    }
  });

  render() {
    let {Search} = this.stylesheet;
    let {
      entity,
      sort,
      onClose,
      context,
      contextTypes,
      searchPlaceholder,
      actionState: {search}
    } = this.props;
    let title = this.constructor.getTitle(this.props);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    let data = port(this.props.data.port.path)
    data = applyContext(data, contextTypes.input, context);
    if (search) {
      data = data.params({'*:__search__': search});
    }
    return (
      <Action noContentWrapper title={title} onClose={onClose}>
        {this.props.search &&
          <Search
            placeholder={searchPlaceholder}
            value={search}
            onChange={this.onSearch}
            throttleOnChange={500}
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
