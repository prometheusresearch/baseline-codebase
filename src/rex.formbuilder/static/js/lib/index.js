/**
 * @jsx React.DOM
 */
'use strict';

/*
var React = window.React = require('react');
window.FormBuilder = require('./FormBuilder');

React.renderComponent(
  <FormBuilder channels={[
    {id: 'entry', title: 'RexEntry'},
    {id: 'survey', title: 'RexSurvey'}
  ]} />,
  document.body
);
*/

module.exports = {
  List: require('./List'),
  Editor: require('./Editor'),
};

if (window) {
  window.React = window.React || require('react');
  window.Rex = window.Rex || {};
  window.Rex.FormBuilder = module.exports;
}
