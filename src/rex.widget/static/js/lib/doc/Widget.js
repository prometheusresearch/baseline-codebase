/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var Icon          = require('../Icon');
var groupBy       = require('../groupBy');
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
    fields.sort(compareFields.bind(null, widget));
    return (
      <VBox style={this.style} size={1}>
        <VBox>
          <VBox margin={10} childrenMargin={10}>
            <VBox style={this.styleName}>{widget.name}</VBox>
            <VBox
              style={this.styleDoc}
              dangerouslySetInnerHTML={{__html: widget.doc}}
              />
          </VBox>
          <Section title="Fields">
            {fields.map(field =>
              <Field
                widget={widget}
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


function compareFields(widget, a, b) {
  if (a.required && !b.required) {
    return -1;
  } else if (!a.required && b.required) {
    return 1;
  } else {
    if (a.owner_widget === widget.name && b.owner_widget !== widget.name) {
      return -1;
    } else if (a.owner_widget !== widget.name && b.owner_widget === widget.name) {
      return 1;
    } else {
      if (a.owner_widget > b.owner_widget) {
        return -1;
      } else if (a.owner_widget < b.owner_widget) {
        return 1;
      } else {
        if (a.name > b.name) {
          return -1;
        } else if (a.name < b.name) {
          return 1;
        } else {
          return 0;
        }
      }
    }
  }
}

module.exports = Widget;
