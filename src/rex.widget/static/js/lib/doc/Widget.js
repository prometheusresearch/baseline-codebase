/**
 * @copyright 2015, prometheus research, llc
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var Icon          = require('../Icon');
var Field         = require('./Field');
var Label         = require('./Label');
var theme         = require('./theme');

var Section = React.createClass({

  styleTitle: {
    fontSize: '90%',
    fontWeight: 'bold',
    padding: '3px 10px',
    background: theme.colors.muted,
    color: theme.colors.mutedText
  },

  render() {
    var {title, children, ...props} = this.props;
    return (
      <VBox {...props}>
        <HBox style={this.styleTitle}>
          {title}
        </HBox>
        <VBox>
          {children}
        </VBox>
      </VBox>
    );
  }
});

var Widget = React.createClass({

  style: {
    overflow: 'auto'
  },

  styleName: {
    fontSize: '140%',
    color: theme.colors.mutedText,
    fontWeight: 'bold'
  },

  styleDoc: {
    fontSize: '90%'
  },

  render() {
    var {widget} = this.props;
    var {showFields} = this.state;
    var fields = widget.fields.slice(0);
    return (
      <VBox style={this.style} size={1}>
        <VBox>
          <VBox margin={10} childrenMargin={10}>
            <VBox style={this.styleName}>{widget.name}</VBox>
            <VBox>
              <p style={this.styleDoc}>{widget.doc}</p>
            </VBox>
          </VBox>
          <Section title="Fields">
            {widget.fields.map(field =>
              <Field
                key={field.name}
                field={field}
                />
            )}
          </Section>
        </VBox>
      </VBox>
    );
  },

  getInitialState() {
    return {
      showFields: true
    };
  },

  _toggleFields(e) {
    e.preventDefault();
    var showFields = !this.state.showFields;
    this.setState({showFields});
  }
});

module.exports = Widget;
