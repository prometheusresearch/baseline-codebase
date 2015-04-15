/**
 * @jsx React.DOM
 */
'use strict';

var RexWidget                     = require('rex-widget/lib/modern');
var {Forms}                       = RexWidget;
var {HBox, VBox}                  = RexWidget.Layout;

var createTodoformSchema = {
  type: 'object',
  properties: {
    todo: {
      type: 'array',
      items: {
        type: 'object',
        required: ['description'],
        properties: {
          description: {
            type: 'string'
          }
        }
      }
    }
  }
};

var CreateTodoItemModal = RexWidget.createWidgetClass({

  render() {
    var defaultValue = {todo: [{completed: false}]};
    return (
      <RexWidget.ModalButton
        ref="modal"
        buttonQuiet
        buttonSuccess
        modalWidth={400}
        buttonText="Create a Todo"
        modalTitle="Create a Todo"
        buttonIcon="plus">
        <Forms.Form
          insert
          schema={createTodoformSchema}
          value={defaultValue}
          onSubmitComplete={this.onSubmitComplete}
          submitTo={this.props.submitTo}>
          <Forms.Fieldset selectFormValue="todo.0">
            <Forms.Field
              label="Description"
              selectFormValue="description"
              />
          </Forms.Fieldset>
        </Forms.Form>
      </RexWidget.ModalButton>
    );
  },

  onSubmitComplete() {
    this.refs.modal.close();
    RexWidget.forceRefreshData();
  }
});

module.exports = CreateTodoItemModal;
