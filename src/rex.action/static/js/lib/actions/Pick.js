/**
 * @copyright 2015, Prometheus Research, LLC
 */

import React                from 'react';
import Stylesheet           from '@prometheusresearch/react-stylesheet';
import RexWidget            from 'rex-widget';
import {VBox, HBox}         from 'rex-widget/lib/Layout';
import {command, Types}     from '../ActionCommand';
import {getEntityTitle}     from '../Entity';
import Title                from './Title';


let Style = {
  header: {
    padding: 10
  },
  search: {
    borderRadius: 0,
    border: 'none'
  }
};

let Pick = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin, RexWidget.Cell.Mixin],

  propTypes: {
    context: React.PropTypes.object,
    onCommand: React.PropTypes.func,
  },

  dataSpecs: {
    data: RexWidget.DataSpecification.collection()
  },

  render() {
    let {entity, onClose, context} = this.props;
    let title = this.constructor.getTitle(this.props);
    let selected = context[entity.name] ? context[entity.name].id : undefined;
    return (
      <VBox size={1} style={Style.self}>
        <HBox style={Style.header}>
          <VBox size={1} style={Style.title}>
            <h4>
              {title}
            </h4>
          </VBox>
          {onClose
            && <RexWidget.Button
              quiet
              icon="remove"
              onClick={onClose}
              />}
        </HBox>
        {this.props.search &&
          <RexWidget.SearchInput
            style={{input: Style.search}}
            value={this.state.search.value}
            onChange={this.state.search.update}
            throttleOnChange={500}
            />}
        <RexWidget.DataTable
          dataSort={makeSortKey(this.props.sort)}
          sortable={this.props.sortable}
          resizableColumns={this.props.resizableColumns}
          dataSpec={this.dataSpecs.data}
          columns={this.props.fields}
          selectable
          selected={selected}
          onSelected={this.onSelected}
          />
      </VBox>
    );
  },

  getDefaultProps() {
    return {
      icon: 'list',
      width: 600
    };
  },

  getInitialState() {
    return {
      search: RexWidget.cell(null)
    };
  },

  onSelected(entityId, entity) {
    this.props.onCommand('default', entity);
  },

  statics: {

    renderTitle({entity, title = `Pick ${entity.name}`}, context) {
      return <Title title={title} entity={entity} context={context} />;
    },

    getTitle(props) {
      return props.title || `Pick ${props.entity.name}`;
    },

    commands: {

      @command(Types.ConfigurableEntity())
      default(props, context, entity) {
        return {...context, [props.entity.name]: entity};
      }
    }
  }
});

function makeSortKey(sort) {
  if (!sort) {
    return;
  }
  return sort.asc ? sort.field : `-${sort.field}`;
}

export default Pick;
