/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

var React                       = require('react');
var RexWidget                   = require('rex-widget');
var {VBox, HBox}                = RexWidget.Layout;
var DS                          = RexWidget.DataSpecification;
var {overflow, boxShadow, rgb}  = RexWidget.StyleUtils;
var Action                      = require('../Action');

var View = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: DS.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    var {fields, entity, context, onClose, width} = this.props;
    var title = this.constructor.getTitle(this.props);
    return (
      <Action title={title} onClose={onClose} width={width}>
        <RexWidget.ShowPreloader data={this.data.data}>
          <RexWidget.Forms.ConfigurableEntityForm
            readOnly
            entity={entity.type}
            value={this.data.data.data}
            fields={fields}
            />
        </RexWidget.ShowPreloader>
      </Action>
    );
  },

  getDefaultProps() {
    return {
      icon: 'eye-open',
      width: 400
    };
  },

  statics: {
    getTitle(props) {
      return props.title || `View ${props.entity.name}`;
    }
  }
});

module.exports = View;
