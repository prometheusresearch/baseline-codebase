/**
 * Form schema for instrument.
 *
 * @jsx React.DOM
 * @copyright Prometheus Research, LLC 2014
 */
'use strict';

var React                             = require('react');
var ReactForms                        = require('react-forms');
var {Mapping, List, Scalar, Variant}  = ReactForms.schema;
var merge                             = require('./merge');
var FieldTypeSelect                   = require('./FieldTypeSelect');
var AddlResponseSelect                = require('./AddlResponseSelect');
var CheckBox                          = require('./CheckBox');
var Button                            = require('./Button');
var FormHelpers                       = require('./FormHelpers');
var CustomRepFieldset                 = require('./CustomRepFieldset');
var EnumerationConstraintFieldset     = require('./EnumerationConstraintFieldset');
var SortableRepeatingFieldset         = require('./SortableRepeatingFieldset');
var BoundsConstraint                  = require('./BoundsConstraint');
var countKeys                         = require('./countKeys');
var {OrderedMap}                      = require('immutable');

var MatrixColumnsFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-MatrixColumnsFieldset">
        <div className="rfb-two-fields-row">
          <ReactForms.Element value={value.child("id")} />
          <div className="rfb-CheckGroup">
            <ReactForms.Element value={value.child("required")} />
          </div>
        </div>
        {value.schema.children.has('type') &&
          <ReactForms.Element value={value.child("type")} />}
        <ReactForms.Element value={value.child("description")} />
      </div>
    );
  }
});


var MatrixRowsFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-MatrixRowsFieldset">
        <div className="rfb-two-fields-row">
          <ReactForms.Element value={value.child("id")} />
          <div className="rfb-CheckGroup">
            <ReactForms.Element value={value.child("required")} />
          </div>
        </div>
        <ReactForms.Element value={value.child("description")} />
      </div>
    );
  }
});


var InstrumentTypeFieldset = React.createClass({

  render() {
    var {value} = this.props;

    // We want to use the same component to render both base types (encoded as
    // enumerated strings) and extended types (encoded as objects (base: ...,
    // ...}) because we want React to handle seemless transition from base to
    // extended types.
    //
    // If we use different components React won't keep focus between renders.
    var constraints;
    var typeElement;
    if (typeof value.value === 'string') {
      constraints = value.update({base: value.value});
      typeElement = (
        <ReactForms.Field
          value={value}
          input={<FieldTypeSelect coerceComplexTypes allowComplexTypes />}
          />
      );
    } else {
      constraints = value;
      typeElement = (
        <ReactForms.Element
          value={value.child("base")}
          />
      );
    }
    return (
      <div className="rfb-InstrumentType">
        <div className="rfb-InstrumentType__base">
            {typeElement}
        </div>
        {constraints.map((value, key) =>
          key !== 'base' &&
            <div className="rfb-InstrumentType__constraint" key={key}>
              <ReactForms.Element value={value} />
            </div>)}
      </div>
    );
  }
});


var InstrumentRecordFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-InstrumentRecordFieldset">
        <div className="rfb-two-fields-row">
          <ReactForms.Element value={value.child("id")} />
          <div className="rfb-CheckGroup">
            <ReactForms.Element value={value.child("required")} />
            <ReactForms.Element value={value.child("identifiable")} />
          </div>
        </div>
        <ReactForms.Element value={value.child("type")} />
        <ReactForms.Element value={value.child("description")} />
        {/*
        // temporary disabled until this fields are supported in
        //  other components
        <div className="rfb-two-fields-row">
          <ReactForms.Element value={value.child("annotation")} />
          <ReactForms.Element value={value.child("explanation")} />
        </div>
        */}
      </div>
    );
  }
});

var InstrumentFormFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-InstrumentForm">
        <div className="rfb-InstrumentForm__head">
          <ReactForms.Element value={value.child("id")} />
          <ReactForms.Element
            className="rfb-InstrumentForm__title"
            value={value.child("title")}
            />
          <ReactForms.Element value={value.child("version")} />
          <ReactForms.Element value={value.child("types")} />
        </div>
        <div className="rfb-InstrumentForm__body">
          <ReactForms.Element value={value.child("record")} />
        </div>
      </div>
    );
  }
});

function RangeSchema(props) {
  props = merge({component: <BoundsConstraint />}, props);
  return Mapping(props, {
    min: Scalar({
      type: "number",
      label: "Minimum:"
    }),
    max: Scalar({
      type: "number",
      label: "Maximum:"
    })
  });
}

function MatrixColumnSchema(props) {
  props = props || {};
  return Mapping({component: MatrixColumnsFieldset}, {
    id: Scalar({
      label: 'Identifier',
      required: true,
      validate: FormHelpers.validateIdentifier
    }),

    required: Scalar({
      type: FormHelpers.BoolType,
      label: "Required:",
      defaultValue: false,
      required: true,
      input: <CheckBox />
    }),

    type: props.includeType && InstrumentTypeSchema({
      allowComplexTypes: false
    }),

    description: Scalar({
      label: "Description:",
      input: <textarea />
    })

  });
}

function validateList(v) {
  if (!v || v.length == 0)
    return new Error('At least one item should be specified');
  return true;
}

function MatrixColumnsSchema() {
  var component = (
    <CustomRepFieldset
      className="rfb-MatrixColumns"
      noItemsTitle="At least one column should be added"
      addTitle="Add Column"
      floatAddButton={true}
      elementsTitle="Columns:"
      />
  );
  return List({component, validate: validateList},
    MatrixColumnSchema({includeType: true}));
}

function MatrixRowsSchema() {
  var component = (
    <CustomRepFieldset
      className="rfb-MatrixRows"
      noItemsTitle="At least one row should be added"
      addTitle="Add Row"
      floatAddButton={true}
      elementsTitle="Rows:"
      />
  );
  return List({component, validate: validateList},
    MatrixColumnSchema());
}

function BaseTypeSchema(props) {
  return Scalar({
    label: "Type:",
    defaultValue: "text",
    required: true,
    input: <FieldTypeSelect allowComplexTypes={props.allowComplexTypes} />
  });
}

function IntegerTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    range: RangeSchema({label: 'Range'})
  });
}

function FloatTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    range: RangeSchema({label: 'Range'})
  });
}

function TextTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset, defaultValue: {base: 'text'}}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    pattern: Scalar({label: 'Pattern'}),
    length: RangeSchema({label: 'Length'})
  });
}

function BooleanTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props)
  });
}

function validateEnumerationTypeValue(v) {
  if (!v || v.length == 0)
    return new Error('Empty enumeration list');
  v = v.toJS();
  for (var name in v) {
    if (v.hasOwnProperty(name)) {
      var result = FormHelpers.validateIdentifier(name);
      if (result instanceof Error)
        return result;
    }
  }
  return true;
}

function validateEnumerationList(v) {
  if (!v)
    return new Error('Enumeration list is not set');
  v = v.toJS();
  if (countKeys(v) == 0)
    return new Error('Enumeration list is empty');
  return true;
}

function validateEnumerationTypeProps(v) {
  if (v instanceof OrderedMap)
    v = v.toJS();
  if (!v)
    return new Error('No type properties');
  if (!v.enumerations || countKeys(v.enumerations) == 0)
    return new Error('Empty enumeration list');
  return true;
}

function EnumerationTypeSchema(props) {
  props = merge({
    component: InstrumentTypeFieldset,
    validate: validateEnumerationTypeProps,
  }, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    enumerations: Scalar({
      type: FormHelpers.AsIsValueType,
      validate: validateEnumerationList,
      label: "Enumerations:",
      component: <EnumerationConstraintFieldset />
    })
  });
}

function EnumerationSetTypeSchema(props) {
  props = merge({
    component: InstrumentTypeFieldset,
    validate: validateEnumerationTypeProps,
  }, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    length: RangeSchema({label: 'Length'}),
    enumerations: Scalar({
      validate: validateEnumerationList,
      type: FormHelpers.AsIsValueType,
      label: "Enumerations:",
      component: <EnumerationConstraintFieldset />
    })
  });
}

function DateTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    range: RangeSchema({label: 'Range'})
  });
}

function TimeTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    range: RangeSchema({label: 'Range'})
  });
}

function DateTimeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    range: RangeSchema({label: 'Range'})
  });
}

function RecordListTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    record: props.allowComplexTypes && InstrumentRecordList({
      allowComplexTypes: false,
      floatAddButton: true}),
    length: RangeSchema({label: 'Length'})
  });
}

function MatrixTypeSchema(props) {
  props = merge({component: InstrumentTypeFieldset}, props);
  return Mapping(props, {
    base: BaseTypeSchema(props),
    rows: props.allowComplexTypes && MatrixRowsSchema(),
    columns: props.allowComplexTypes && MatrixColumnsSchema()
  });
}

var simpleType = Scalar({
  defaultValue: 'text',
  label: 'Type:',
  component: InstrumentTypeFieldset
});

function InstrumentTypeSchema(props) {
  var key = function(value) {
    if (typeof value === 'string') {
      return `${value}Simple`;
    } else if (value && value.get) {
      return value.get('base', 'text');
    } else {
      return 'text';
    }
  };
  return Variant({key}, {
    integer: IntegerTypeSchema(props),
    float: FloatTypeSchema(props),
    text: TextTypeSchema(props),
    boolean: BooleanTypeSchema(props),
    enumeration: EnumerationTypeSchema(props),
    enumerationSet: EnumerationSetTypeSchema(props),
    date: DateTypeSchema(props),
    time: TimeTypeSchema(props),
    dateTime: DateTimeSchema(props),
    recordList: RecordListTypeSchema(props),
    matrix: MatrixTypeSchema(props),

    textSimple: simpleType,
    integerSimple: simpleType,
    floatSimple: simpleType,
    booleanSimple: simpleType,
    enumerationSimple: simpleType,
    enumerationSetSimple: simpleType,
    dateSimple: simpleType,
    timeSimple: simpleType,
    dateTimeSimple: simpleType
  });
};

function InstrumentRecordSchema(props) {
  props = props || {};
  return Mapping({component: InstrumentRecordFieldset}, {
    id: Scalar({
      label: 'Identifier:',
      required: true,
      validate: FormHelpers.validateIdentifier,
    }),

    required: Scalar({
      type: FormHelpers.BoolType,
      label: "Required:",
      defaultValue: false,
      required: true,
      component: <ReactForms.Field inline input={CheckBox} />
    }),

    identifiable: Scalar({
      type: FormHelpers.BoolType,
      label: "Identifiable:",
      defaultValue: false,
      required: true,
      component: <ReactForms.Field inline input={CheckBox} />
    }),

    type: InstrumentTypeSchema({
      allowComplexTypes: props.allowComplexTypes
    }),

    description: Scalar({
      label: "Description:",
      input: <textarea />
    }),

    explanation: FormHelpers.SimpleScalar(),
    annotation: FormHelpers.SimpleScalar()

    /*
    explanation: Scalar({
      label: "Explanation:",
      defaultValue: 'none',
      input: <AddlResponseSelect />,
      required: false
    }),

    annotation: Scalar({
      label: "Annotation:",
      defaultValue: 'none',
      input: <AddlResponseSelect />,
      required: false
    })
    */
  });
}

function InstrumentRecordList(props) {
  var component = (
    <CustomRepFieldset
      className="rfb-InstrumentRecords"
      noItemsTitle="No Fields"
      addTitle="Add Field"
      floatAddButton={props.floatAddButton}
      elementsTitle="Fields:"
      />
  );
  props = merge({name: 'record', component}, props);
  return List(props,
    InstrumentRecordSchema({allowComplexTypes: props.allowComplexTypes}));
}

function InstrumentSchema(props) {
  props = merge({component: InstrumentFormFieldset}, props);
  return Mapping(props, {

    id: FormHelpers.HiddenScalar({
      validate: FormHelpers.validateRFC3986
    }),

    title: Scalar({
      label: "Instrument Title:",
      defaultValue: "Untitled Instrument",
      required: true
    }),

    version: FormHelpers.HiddenScalar({
      validate: FormHelpers.validateRFC3986
    }),

    types: FormHelpers.SimpleScalar(),

    record: InstrumentRecordList({allowComplexTypes: true})
  });
}

module.exports = InstrumentSchema;
