/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React               = require('react');
var RexWidget           = require('rex-widget');
var DS                  = RexWidget.DataSpecification;
var {VBox, HBox}        = RexWidget.Layout;

var Style = {
  header: {
    padding: 10
  },
  search: {
    borderRadius: 0,
    border: 'none'
  }
};

var Pick = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin, RexWidget.Cell.Mixin],

  propTypes: {
    context: React.PropTypes.object,
    onContext: React.PropTypes.func
  },

  dataSpecs: {
    data: DS.collection()
  },

  render() {
    var {entity, onClose} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <VBox size={1} style={{...Style.self, width: this.props.width}}>
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
          columns={this.props.columns}
          selectable
          selected={this.props.context[this.props.entity.name]}
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

  onSelected(selected, data) {
    var nextContext = {...this.props.context};
    nextContext[this.props.entity.name] = selected;
    this.props.onContext(nextContext);
  },

  statics: {
    getTitle(props) {
      return props.title || `Pick ${props.entity.name}`;
    }
  }
});

function makeSortKey(sort) {
  if (!sort) {
    return;
  }
  return sort.asc ? sort.field : `-${sort.field}`;
}

module.exports = Pick;
