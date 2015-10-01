/**
 * @copyright 2015, Prometheus Research, LLC
 */
'use strict';

let React                   = require('react');
let Autocomplete            = require('../Autocomplete');
let DataSpecificationMixin  = require('../DataSpecificationMixin');
let {collection, prop}      = require('../DataSpecification');
let Field                   = require('./Field');
let ReadOnlyField           = require('./ReadOnlyField');

/**
 *  AutocompleteField component.
 *
 * Renders a <Field> with an <Autocomplete> widget or
 * if ``readOnly`` is true a <ReadOnlyField> with an <EntityTitle>
 * is rendered.
 *
 * @public
 */
export default class AutocompleteField extends React.Component {

  static propTypes = {

    /**
     * The **dataSpec** is an instance of ``class DataSpecification``.
     * It describes which database entity to query.
     */
    dataSpec: React.PropTypes.object,

    /**
     * When ``true``, the title of the entity (from dataSpec) 
     * is feteched and displayed; 
     * otherwise the <Autocomplete> widget is displayed. 
     */
    readOnly: React.PropTypes.bool,

    /**
     * The initial value of the field.  
     * The **formValue** is passed to <Field>.
     */
    formValue: React.PropTypes.object,

    /**
     * The database field name which holds the value to be auto-completed.
     */
    valueAttribute: React.PropTypes.string,

    /**
     * The database field name which holds the title.
     */
    titleAttribute: React.PropTypes.string,

    /**
     * Has **resultList** property which contains a css attribute object
     * used to style the <Autocomplete> widget.
     */
    style: React.PropTypes.object
  };

  render() {
    let {
      dataSpec, readOnly, formValue,
      valueAttribute, titleAttribute, style,
      ...props
    } = this.props;
    if (readOnly) {
      return (
        <ReadOnlyField {...props} formValue={formValue}>
          {formValue.value &&
            <EntityTitle
              dataSpec={dataSpec}
              titleAttribute={titleAttribute}
              value={formValue.value}
              />}
        </ReadOnlyField>
      );
    } else {
      let titleDataSpec = dataSpec.merge(this._populateParameters());
      let queryDataSpec = dataSpec.port.path.indexOf('__to__') > -1 ?
        titleDataSpec.merge({'query': true}) :
        titleDataSpec;
      return (
        <Field {...props} data={undefined} formValue={formValue}>
          <Autocomplete
            style={{resultList: style && style.resultList}}
            dataSpec={queryDataSpec}
            titleDataSpec={titleDataSpec}
            valueAttribute={valueAttribute}
            titleAttribute={titleAttribute}
            />
        </Field>
      );
    }
  }

  _populateParameters() {
    let context = this.props.formValue.params.context;
    let populatedParameters = {};
    for (let key in context) {
      if (context.hasOwnProperty(key)) {
        let value = context[key];
        if (value['meta:type'] !== undefined) {
          populatedParameters[':' + key] = value.id;
        } else {
          populatedParameters[':' + key] = value;
        }
      }
    }
    return populatedParameters;
  }
}

let EntityTitle = React.createClass({
  mixins: [DataSpecificationMixin],

  dataSpecs: {
    dataSpec: collection({'*': prop('value')})
  },

  fetchDataSpecs: {
    dataSpec: true
  },

  render() {
    let {titleAttribute} = this.props;
    let {data} = this.data.dataSpec;
    if (data) {
      return <div>{data[0][titleAttribute]}</div>;
    } else {
      return null;
    }
  },

  getDefaultProps() {
    return {
      titleAttribute: 'title'
    };
  }
});
