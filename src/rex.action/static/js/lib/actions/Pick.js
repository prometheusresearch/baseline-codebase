/**
 * @copyright 2015, Prometheus Research, LLC
 */

import autobind             from 'autobind-decorator';
import React                from 'react';
import Stylesheet           from '@prometheusresearch/react-stylesheet';
import RexWidget            from 'rex-widget';
import DataTable            from 'rex-widget/lib/datatable/DataTable';
import Port                 from 'rex-widget/lib/data/Port';
import {VBox, HBox}         from 'rex-widget/lib/Layout';
import {command, Types}     from '../ActionCommand';
import * as Entity          from '../Entity';
import Title                from './Title';

@Stylesheet
export default class Pick extends React.Component {

  static propTypes = {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  };

  static defaultProps = {
    icon: 'list',
    width: 600
  };

  static stylesheet = {
    Root: VBox,
    Title: VBox,
    Header: {
      Component: HBox,
      padding: 10,
    },
    Search: {
      Component: RexWidget.SearchInput,
      borderRadius: 0,
      border: 'none',
    }
  };

  constructor(props) {
    super(props);
    this.state = {
      search: null
    };
  }

  render() {
    let {Root, Header, Search, Title} = this.stylesheet;
    let {entity, sort, onClose, context, contextTypes} = this.props;
    let {search} = this.state;
    let title = this.constructor.getTitle(this.props);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    let data = Port(this.props.data.port.path)
      .fetch(getContextParameters(contextTypes.input, context));
    if (search) {
      data = data.fetch({'*:__search__': search});
    }
    return (
      <Root size={1}>
        <Header>
          <Title size={1}>
            <h4>
              {title}
            </h4>
          </Title>
          {onClose
            && <RexWidget.Button
              quiet
              icon="remove"
              onClick={onClose}
              />}
        </Header>
        {this.props.search &&
          <Search
            value={this.state.search}
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
      </Root>
    );
  }

  @autobind
  onSelect(entityId, entity) {
    this.props.onCommand('default', entity);
  }

  @autobind
  onSearch(search) {
    this.setState({search});
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

function getContextParameters(input, context) {
  let parameters = {};
  for (let key in input.rows) {
    if (input.rows.hasOwnProperty(key)) {
      let value = context[key];
      parameters[':' + key] = Entity.isEntity(value) ? value.id : value;
    }
  }
  return parameters;
}
