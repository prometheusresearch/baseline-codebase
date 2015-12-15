/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import React                from 'react';
import * as Stylesheet      from '@prometheusresearch/react-stylesheet';
import {VBox, HBox}         from '@prometheusresearch/react-box';
import RexWidget            from 'rex-widget';
import DataTable            from 'rex-widget/lib/datatable/DataTable';
import Port                 from 'rex-widget/lib/data/Port';
import {command, Types}     from '../execution/Command';
import * as Entity          from '../Entity';
import Action               from '../Action';
import applyContext         from '../applyContext';
import Title                from './Title';

@Stylesheet.styleable
export default class Pick extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600
  };

  static stylesheet = Stylesheet.createStylesheet({
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
      actionState: {search}
    } = this.props;
    let title = this.constructor.getTitle(this.props);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    let data = Port(this.props.data.port.path)
    data = applyContext(data, contextTypes.input, context);
    if (search) {
      data = data.params({'*:__search__': search});
    }
    return (
      <Action noContentWrapper title={title} onClose={onClose}>
        {this.props.search &&
          <Search
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
