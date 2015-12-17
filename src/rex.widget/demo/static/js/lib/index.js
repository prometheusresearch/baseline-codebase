'use strict';

var React        = require('react');
var RexWidget    = require('rex-widget');
var {HBox, VBox} = RexWidget.Layout;
var TodoList     = require('./TodoList');

import {PillList, TabList, Pill, Tab} from 'rex-widget/lib/ui';

var App = RexWidget.createWidgetClass({

  render() {
    return (
      <VBox size={1} centerHorizontally>
        <HBox size={1} width={1000}>
          <VBox size={1}>
            <PillList selected="nope">
              <Pill id="nope">Hello</Pill>
              <Pill id="nope2">Hello</Pill>
            </PillList>
            <PillList selected="nope" position="bottom">
              <Pill id="nope">Hello</Pill>
              <Pill id="nope2">Hello</Pill>
            </PillList>
            <PillList selected="nope" position="left">
              <Pill id="nope">Hello</Pill>
              <Pill id="nope2">Hello</Pill>
            </PillList>
            <PillList selected="nope" position="right">
              <Pill id="nope">Hello</Pill>
              <Pill id="nope2">Hello</Pill>
            </PillList>
          </VBox>
          <VBox size={1}>
            <TabList selected="nope">
              <Tab title="Nope" id="nope">Hello</Tab>
              <Tab title="Another" id="nope2">Hello</Tab>
            </TabList>
            <TabList position="bottom" selected="nope">
              <Tab title="Nope" id="nope">Hello</Tab>
              <Tab title="Another" id="nope2">Hello</Tab>
            </TabList>
            <TabList position="left" selected="nope">
              <Tab title="Nope" id="nope">Hello</Tab>
              <Tab title="Another" id="nope2">Hello</Tab>
            </TabList>
            <TabList position="right" selected="nope">
              <Tab title="Nope" id="nope">Hello</Tab>
              <Tab title="Another" id="nope2">Hello</Tab>
            </TabList>
          </VBox>
        </HBox>
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
