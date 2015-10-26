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
var {getEntityTitle, isLoaded}  = require('../Entity');
var Title                       = require('./Title');

var View = React.createClass({
  mixins: [RexWidget.DataSpecificationMixin],

  dataSpecs: {
    data: DS.entity()
  },

  fetchDataSpecs: {
    data: true
  },

  render() {
    let {fields, entity, context, onClose, width} = this.props;
    let title = this.constructor.getTitle(this.props);
    let {data} = this.data.data;
    return (
      <Action title={title} onClose={onClose} width={width}>
        {isLoaded(data) ?
          <RexWidget.Forms.ConfigurableEntityForm
            key={data.id}
            readOnly
            entity={entity.type.name}
            value={data}
            fields={fields}
            /> :
            <RexWidget.Preloader />}
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

    renderTitle({entity, title = `View ${entity.name}`}, context) {
      return <Title title={title} entity={entity} context={context} />;
    },

    getTitle(props) {
      return props.title || `View ${props.entity.type.name}`;
    }
  }
});

module.exports = View;
