/**
 * @copyright 2014, Prometheus Research, LLC
 */
'use strict';

var React         = require('react');
var {VBox, HBox}  = require('../layout');
var merge         = require('../merge');

var Hoverable = {

  getInitialState() {
    return {hover: false};
  },

  onMouseEnter() {
    this.setState({hover: true});
  },

  onMouseLeave() {
    this.setState({hover: false});
  }
};

var WidgetItem = React.createClass({
  mixins: [Hoverable],

  style: {
    cursor: 'pointer'
  },

  styleSelected: {
    background: '#ccc'
  },

  styleHover: {
    background: '#ddd'
  },

  render() {
    var {widget, selected, ...props} = this.props;
    var {hover} = this.state;
    return (
      <VBox {...props}
        style={merge(this.style, selected && this.styleSelected, hover && this.styleHover)}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onClick={this.onClick}>
        <VBox margin={5}>
          {widget.name}
        </VBox>
      </VBox>
    );
  },

  onClick() {
    var {widget, onClick} = this.props;
    onClick(widget);
  }
});

var WidgetList = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widgets, selectedWidget, onSelect, ...props} = this.props;
    return (
      <VBox {...props} style={this.style}>
        {widgets.map(widget =>
          <WidgetItem
            selected={selectedWidget && widget.name === selectedWidget.name}
            key={widget.name}
            onClick={onSelect}
            widget={widget}
            />
        )}
      </VBox>
    );
  }
});

var DocSidebar = React.createClass({

  render() {
    var {widgets, onSelect, selectedWidget, ...props} = this.props;
    var {query} = this.state;
    if (query !== '') {
      var queryRe = new RegExp(query, 'i');
      widgets = widgets.filter(w => queryRe.exec(w.name));
    }
    return (
      <VBox {...props} style={this.style} height="100%">
        <VBox>
          <input
            value={query}
            onChange={this.onQueryChange}
            />
        </VBox>
        <WidgetList
          size={1}
          selectedWidget={selectedWidget}
          widgets={widgets}
          onSelect={onSelect}
          />
      </VBox>
    );
  },

  getInitialState() {
    return {query: ''};
  },

  onQueryChange(e) {
    var query = e.target.value;
    this.setState({query});
  }
});

var Placeholder = React.createClass({

    style: {
      color: '#ccc'
    },

    render() {
      return (
        <VBox size={1} centerHorizontally centerVertically>
          <VBox style={this.style}>
            Choose widget from the sidebar at the left
          </VBox>
        </VBox>
      );
    }
});

var Field = React.createClass({

  style: {
    background: '#eee'
  },

  styleName: {
    fontWeight: 'bold'
  },

  render() {
    var {field, ...props} = this.props;
    return (
      <VBox {...props} style={this.style} margin="10px 0px">
        <VBox margin={10}>
          <VBox style={this.styleName}>{field.name}</VBox>
          <VBox>{field.doc}</VBox>
        </VBox>
      </VBox>
    );
  }
});

var Widget = React.createClass({

  style: {
    overflow: 'auto'
  },

  render() {
    var {widget} = this.props;
    return (
      <VBox style={this.style} size={1}>
        <VBox margin={10}>
          <VBox>
            <h1>{widget.name}</h1>
            <p>{widget.doc}</p>
          </VBox>
          <VBox>
            {widget.fields.map(field => <Field field={field} />)}
          </VBox>
        </VBox>
      </VBox>
    );
  }
});

var DocPanel = React.createClass({

  render() {
    var {selectedWidget, ...props} = this.props;
    return (
      <VBox {...props}>
        {selectedWidget === null && <Placeholder />}
        {selectedWidget !== null && <Widget widget={selectedWidget} />}
      </VBox>
    );
  }
});

var Doc = React.createClass({

  style: {
    overflow: 'hidden'
  },

  render() {
    var {selectedWidget} = this.state;
    var {widgets, ...props} = this.props;
    return (
      <HBox {...props} style={this.style} width="100%" height="100%">
        <DocSidebar
          size={1}
          selectedWidget={selectedWidget}
          widgets={widgets}
          onSelect={this.onWidgetSelect}
          />
        <DocPanel
          size={4}
          selectedWidget={selectedWidget}
          />
      </HBox>
    );
  },

  getDefaultProps() {
    return {
      size: 1
    };
  },

  getInitialState() {
    return {
      selectedWidget: null
    };
  },

  onWidgetSelect(selectedWidget) {
    this.setState({selectedWidget});
  }
});

module.exports = Doc;
