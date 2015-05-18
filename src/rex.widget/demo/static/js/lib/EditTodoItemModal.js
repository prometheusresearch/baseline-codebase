'use strict';

var RexWidget    = require('rex-widget');
var {Forms}      = RexWidget;
var {HBox, VBox} = RexWidget.Layout;

var editTodoFormSchema = {
  type: 'object',
  properties: {
    todo: {
      type: 'array',
      items: {
        type: 'object',
        required: ['description', 'completed'],
        properties: {
          description: {
            type: 'string'
          },
          completed: {
            type: 'boolean'
          }
        }
      }
    }
  }
};

var EditTodoItemModal = RexWidget.createWidgetClass({

  render() {
    return (
      <RexWidget.ModalButton
        ref="modal"
        buttonQuiet
        buttonText="Edit"
        modalTitle="Edit"
        modalWidth={400}
        buttonIcon="pencil">
        <Forms.Form
          schema={editTodoFormSchema}
          value={{todo: [this.props.item]}}
          onSubmitComplete={this.onSubmitComplete}
          submitTo={this.props.submitTo}>
          <Forms.Fieldset selectFormValue="todo.0">
            <Forms.Field
              label="Description"
              selectFormValue="description"
              />
            <Forms.CheckboxField
              label="Completed"
              selectFormValue="completed"
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

module.exports = EditTodoItemModal;

