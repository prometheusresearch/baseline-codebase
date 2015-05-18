'use strict';

var RexWidget    = require('rex-widget');
var {HBox, VBox} = RexWidget.Layout;
var TodoList     = require('./TodoList');

var App = RexWidget.createWidgetClass({

  render() {
    return (
      <VBox size={1} centerHorizontally>
        <VBox size={1} width={600}>
          <VBox centerHorizontally>
            <h1>{this.props.title}</h1>
          </VBox>
          <TodoList
            list={this.props.list}
            item={this.props.item}
            columns={this.props.columns}
            fields={this.props.fields}
            renderToolbar={this.renderToolbar}
            />
          <VBox centerHorizontally style={{marginTop: 10}}>
            <p>{this.props.footerText}</p>
          </VBox>
        </VBox>
      </VBox>
    );
  },

  renderToolbar() {
    return (
      <VBox>
        <RexWidget.ModalButton
          modalTitle="Help"
          buttonQuiet
          buttonText="Help"
          buttonIcon="question-sign">
          {this.props.helpText}
        </RexWidget.ModalButton>
      </VBox>
    );
  }
});

module.exports = App;
