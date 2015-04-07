/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                           = require('react/addons');
var cloneElement                    = require('./cloneElement');
var {collection, entity, computed}  = require('./DataSpecification');
var emptyFunction                   = require('./emptyFunction');
var DataSpecificationMixin          = require('./DataSpecificationMixin');
var Layout                          = require('./Layout');
var Modal                           = require('./Modal');
var Button                          = require('./Button');
var ShowPreloader                   = require('./ShowPreloader');
var Cell                            = require('./Cell');
var Link                            = require('./Link');
var DataTable                       = require('./DataTable');
var ModalButton                     = require('./ModalButton');

function _selected(props, state) {
  if (props.selected !== undefined) {
    return props.selected;
  } else {
    return state.selected.value;
  }
}

var ListWithInfoStyle = {
  options: {
    marginTop: 10
  }
};

var ListWithInfo = React.createClass({
  mixins: [DataSpecificationMixin, Cell.Mixin],

  dataSpecs: {
    listData: collection(),
    infoData: entity({'*': computed(_selected, {required: true})})
  },

  fetchDataSpecs: {
    infoData: true
  },

  render() {
    var data = this.data;
    var selected = this.selected();
    var list = cloneElement(
      this.props.list, {
        dataSpec: this.dataSpecs.listData,
        selected: selected,
        onSelected: this.onSelected
      });
    var info = cloneElement(
      this.props.info, {
        data: this.data.infoData
      });
    return (
      <Layout.VBox size={1}>
        {this.props.heading && <h3>{this.props.heading}</h3>}
        <Layout.HBox size={1}>
          <Layout.VBox size={4}>
            {list}
          </Layout.VBox>
          <Layout.VBox size={1} padding={10} scrollable>
            {selected ?
              <ShowPreloader
                info={this.data.infoData}>
                <h5>Details</h5>
                {info}
                {Link.interpolateLinkParams(
                  this.props.moreLink,
                  'id',
                  data.infoData.data && data.infoData.data.id)}
              </ShowPreloader> :
              <Layout.VBox>
                {this.props.noEntitySelectedText}
              </Layout.VBox>}
              {this.renderOptions()}
          </Layout.VBox>
        </Layout.HBox>
      </Layout.VBox>
    );
  },

  renderOptions() {
    var selected = this.selected();
    return (
      <Layout.VBox style={ListWithInfoStyle.options}>
        {this.props.renderOptions(selected)}
        {this.props.helpText &&
          <ModalButton
            buttonQuiet
            buttonIcon="question-sign"
            buttonText="Help"
            modalMaxWidth="60%"
            modalMaxHeight="80%"
            modalTitle="Help">
            <div dangerouslySetInnerHTML={{__html: this.props.helpText}} />
          </ModalButton>}
      </Layout.VBox>
    );
  },

  getDefaultProps() {
    return {
      noEntitySelectedText: 'Select an entity from the list',
      list: <DataTable columns={[{name: 'ID', key: ['id']}]} />,
      info: null,
      moreLink: null,
      renderOptions: emptyFunction
    };
  },

  getInitialState() {
    return {
      selected: Cell.cell(null, {param: this.props.selectedParam})
    };
  },

  onSelected(nextSelected) {
    if (this.props.selected !== undefined) {
      return this.props.onSelected(nextSelected);
    } else {
      return this.state.selected.update(nextSelected);
    }
  },

  selected() {
    return _selected(this.props, this.state);
  }
});

module.exports = ListWithInfo;
