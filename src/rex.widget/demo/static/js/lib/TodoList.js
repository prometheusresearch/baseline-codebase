/**
 * @jsx React.DOM
 */
'use strict';

var RexWidget                     = require('rex-widget/lib/modern');
var {collection, entity, state}   = RexWidget.DataSpecification;
var {HBox, VBox}                  = RexWidget.Layout;
var TodoItem                      = require('./TodoItem');
var CreateTodoItemModal           = require('./CreateTodoItemModal');
var EditTodoItemModal             = require('./EditTodoItemModal');

var TodoList = RexWidget.createWidgetClass({

  /*
   * We define how data specifications passed in as props should be bound to
   * component's props and state.
   *
   * Note that we do not set from which port we are fetching data, that should
   * belong to configuration.
   */
  dataSpecs: {
    /*
     * List of todos.
     */
    list: collection(),
    /*
     * A selected todo, we use an additional data spec here as we may want to
     * see more info on selected todo vs. the info we see in the list.
     *
     * We bind 'todo' port filter to the value of 'selected' key of component's
     * state. This is the place where we will keep the id of selected todo.
     *
     * We define that 'todo' binding is 'required', that means that data won't
     * be fetched if 'selected' value is not defined.
     */
    item: entity({
      'todo': state('selected', {required: true})
    })
  },

  /*
   * We define which data specs should be fetched by the component by listing
   * their names as keys in fetchDataSpecs property.
   */
  fetchDataSpecs: {
    item: true
  },

  getInitialState() {
    return {
      /*
       * We define a single component state 'selected' which is mapped to 'todo'
       * query string param of the page. That automatically activates history
       * support in the app so browser's back button works.
       */
      selected: RexWidget.cell(null, {param: 'todo'}),
      mode: RexWidget.cell('all', {param: 'mode'})
    };
  },

  render() {
    return (
      <VBox size={1}>
        <HBox width={200}>
          <CreateTodoItemModal
            submitTo={this.props.item}
            />
          {this.data.item.loaded &&
            <EditTodoItemModal
              submitTo={this.props.item}
              item={this.data.item.data}
              />}
          {this.props.renderToolbar()}
        </HBox>
        <VBox size={1} style={{marginBottom: 20}}>
          {!this.state.selected.value &&
            <p>Please selected a todo item from the list below</p>}
          {this.state.selected.value && this.data.item.loading &&
            <RexWidget.Preloader />}
          {this.state.selected.value && this.data.item.loaded &&
            <TodoItem
              item={this.data.item}
              fields={this.props.fields}
              />}
        </VBox>
        <VBox size={6}>
          <RexWidget.DataTable
            selectable
            selected={this.state.selected.value}
            onSelected={this.state.selected.update}
            dataSpec={this.dataSpecs.list}
            columns={this.props.columns}
            />
        </VBox>
      </VBox>
    );
  }
});

module.exports = TodoList;
