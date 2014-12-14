/**
 * @jsx React.DOM
 */
'use strict';

var React                                 = require('react');
var ReactForms                            = require('react-forms');
var {OrderedMap, Map}                     = require('immutable');
var {ListNode, ScalarNode, MappingNode}   = ReactForms.schema;
var merge                                 = require('../merge');
var CheckBox                              = require('../CheckBox');
var Select                                = require('../Select');
var isString                              = require('../isString');
var RepeatingFieldset                     = require('./RepeatingFieldset');
var TransactionalFieldset                 = require('./TransactionalFieldset');
var Instrument                            = require('./Instrument');
var InstrumentRecordList                  = require('./InstrumentRecordList');
var InstrumentRecordType                  = require('./InstrumentRecordType');
var InstrumentRecord                      = require('./InstrumentRecord');
var EnumerationCollectionFieldset         = require('./EnumerationCollectionFieldset');

var EMPTY_MAP = Map();

var SIMPLE_TYPES = {
  TEXT: 'text',
  INTEGER: 'integer',
  FLOAT: 'float',
  BOOLEAN: 'boolean',
  DATE: 'date',
  TIME: 'time',
  DATE_TIME: 'dateTime',
  ENUMERATION: 'enumeration',
  ENUMERATION_SET: 'enumerationSet'
};

var COMPLEX_TYPES = {
  RECORD_LIST: 'recordList',
  MATRIX: 'matrix'
};

var SIMPLE_TYPE_SELECT = (
  <Select
    emptyValue={false}
    options={Select.optionsFromObject(SIMPLE_TYPES)}
    />
);

var TYPE_SELECT = (
  <Select
    emptyValue={false}
    options={
      Select.optionsFromObject(SIMPLE_TYPES).concat(
        Select.optionsFromObject(COMPLEX_TYPES))}
    />
);

var TERNARY_VALUE_SELECT = (
  <Select
    emptyValue={false}
    options={[
      {id: 'none', title: 'None'},
      {id: 'optional', title: 'Optional'},
      {id: 'required', title: 'Required'}
    ]}
    />
);

class BoundConstraint extends MappingNode {

  getDefaultProps() {
    return {transactionalField: true};
  }

  getChildren() {
    return OrderedMap({
      min: ReactForms.schema.NumberNode.create({
        label: 'Min:',
        transactionalField: true
      }),
      max: ReactForms.schema.NumberNode.create({
        label: 'Max:',
        transactionalField: true
      })
    });
  }
}

/**
 * This is an abstract node type which instantiates into some concrete schema
 * node based on value.
 */
class TypeObjectNode extends ReactForms.schema.Node {

  getDefaultProps() {
    return {
      defaultValue: 'text',
      component: InstrumentRecordType,
      allowComplexTypes: true
    };
  }

  instantiate(value) {
    // coerce from base type to extended type
    if (isString(value)) {
      value = Map({base: value});
    }
    var node = this.instantiateNode(value);
    return {node, value};
  }

  /**
   * Determine schema based on value.
   */
  instantiateNode(value) {
    var base = value && value.get ?
      value.get('base', SIMPLE_TYPES.TEXT) :
      SIMPLE_TYPES.TEXT;
    switch (base) {
      case SIMPLE_TYPES.TEXT:
        return new TextTypeNode(this.props);
      case SIMPLE_TYPES.INTEGER:
        return new IntegerTypeNode(this.props);
      case SIMPLE_TYPES.FLOAT:
        return new FloatTypeNode(this.props);
      case SIMPLE_TYPES.BOOLEAN:
        return new BooleanTypeNode(this.props);
      case SIMPLE_TYPES.DATE:
        return new DateTypeNode(this.props);
      case SIMPLE_TYPES.TIME:
        return new TimeTypeNode(this.props);
      case SIMPLE_TYPES.DATE_TIME:
        return new DateTimeTypeNode(this.props);
      case SIMPLE_TYPES.ENUMERATION:
        return new EnumerationTypeNode(this.props);
      case SIMPLE_TYPES.ENUMERATION_SET:
        return new EnumerationSetTypeNode(this.props);
      case COMPLEX_TYPES.RECORD_LIST:
        return new RecordListTypeNode(this.props);
      case COMPLEX_TYPES.MATRIX:
        return new MatrixTypeNode(this.props);
    }
  }
}

function TypeNode(props) {
  var allowComplexTypes = props.get('allowComplexTypes');
  return ScalarNode.create({
    transactionalField: true,
    label: 'Type:',
    input: allowComplexTypes ? TYPE_SELECT : SIMPLE_TYPE_SELECT
  });
}

class BaseTypeNode extends MappingNode {

  getDefaultProps() {
    return {transactionalField: true};
  }
}

class TextTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'text'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      length: BoundConstraint.create({label: 'Length:'}),
      pattern: ScalarNode.create({
        label: 'Pattern:',
        transactionalField: true
      })
    });
  }
}

class IntegerTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'integer'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      range: BoundConstraint.create({label: 'Range:'})
    });
  }
}

class FloatTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'float'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      range: BoundConstraint.create({label: 'Range:'})
    });
  }
}

class BooleanTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'boolean'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props)
    });
  }
}

class DateTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'date'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      range: BoundConstraint.create({label: 'Range:'})
    });
  }
}

class TimeTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'time'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      range: BoundConstraint.create({label: 'Range:'})
    });
  }
}

class DateTimeTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'dateTime'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      range: BoundConstraint.create({label: 'Range:'})
    });
  }
}

class EnumerationTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'enumeration'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      enumerations: EnumerationCollectionNode.create()
    });
  }
}

class EnumerationSetTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'enumerationSet'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      length: BoundConstraint.create({label: 'Length:'}),
      enumerations: EnumerationCollectionNode.create()
    });
  }
}

/**
 * Enumeration Collection Object from Instrument specification.
 *
 * It is a mapping with arbitrary keys which serve as identifiers, the value
 * under a key is a description of enumeration.
 */
class EnumerationCollectionNode extends ReactForms.schema.CompositeNode {

  getDefaultProps() {
    return {
      label: 'Enumerations:',
      component: EnumerationCollectionFieldset
    };
  }

  get defaultValue() {
    return Map();
  }

  keys(value) {
    return value.keys();
  }

  has(key) {
    return true;
  }

  get(key) {
    return EnumerationNode.create();
  }

  getChildren() {
    return EMPTY_MAP;
  
  }
}


class EnumerationNode extends MappingNode {

  getChildren() {
    return OrderedMap({description: ScalarNode.create()});
  }
}

var RECORDS_REPEATING_FIELDSET = (
  <RepeatingFieldset
    showBottomButton={false}
    buttonCaption="Add field"
    />
);

class RecordListTypeNode extends BaseTypeNode {

  get defaultValue() {
    return Map({base: 'recordList'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      length: BoundConstraint.create({label: 'Length:'}),
      record: ListNode.create({
        label: 'Fields:',
        component: RECORDS_REPEATING_FIELDSET,
        children: InstrumentRecordNode.create({allowComplexTypes: false})
      })
    });
  }
}

var COLUMNS_REPEATING_FIELDSET = (
  <RepeatingFieldset
    showBottomButton={false}
    buttonCaption="Add column"
    />
);

var ROWS_REPEATING_FIELDSET = (
  <RepeatingFieldset
    showBottomButton={false}
    buttonCaption="Add row"
    />
);

class MatrixTypeNode extends MappingNode {

  get defaultValue() {
    return Map({base: 'matrix'});
  }

  getChildren() {
    return OrderedMap({
      base: TypeNode(this.props),
      columns: ListNode.create({
        label: 'Columns:',
        component: COLUMNS_REPEATING_FIELDSET,
        children: ColumnObjectNode.create()
      }),
      rows: ListNode.create({
        label: 'Rows:',
        component: ROWS_REPEATING_FIELDSET,
        children: RowObjectNode.create()
      })
    });
  }
}

class ColumnObjectNode extends MappingNode {

  getDefaultProps() {
    return {
      component: TransactionalFieldset,
      transactionalFieldset: true
    };
  }

  getChildren() {
    return OrderedMap({
      id: ScalarNode.create({
        label: 'Identifier:',
        transactionalField: true,
        required: true
      }),

      description: ScalarNode.create({
        label: 'Description:',
        transactionalField: true,
        input: <textarea />
      }),

      required: ScalarNode.create({
        type: 'bool',
        label: 'Required:',
        transactionalField: true,
        defaultValue: false,
        required: true,
        input: CheckBox
      }),

      type: TypeObjectNode.create({allowComplexTypes: false})
    });
  }
}

class RowObjectNode extends MappingNode {

  getDefaultProps() {
    return {
      component: TransactionalFieldset,
      transactionalFieldset: true
    };
  }

  getChildren() {
    return OrderedMap({
      id: ScalarNode.create({
        label: 'Identifier:',
        transactionalField: true,
        required: true
      }),

      description: ScalarNode.create({
        label: 'Description:',
        transactionalField: true,
        input: <textarea />
      }),

      required: ScalarNode.create({
        type: 'bool',
        label: 'Required:',
        defaultValue: false,
        required: true,
        input: CheckBox
      })
    });
  }

}

class InstrumentRecordNode extends MappingNode {

  getDefaultProps() {
    return {
      component: InstrumentRecord,
      transactionalFieldset: true
    };
  }

  getChildren() {
    var allowComplexTypes = this.props.get('allowComplexTypes');
    return OrderedMap({
      id: ScalarNode.create({
        label: 'Identifier:',
        transactionalField: true,
        required: true
      }),

      description: ScalarNode.create({
        label: 'Description:',
        transactionalField: true,
        input: <textarea />
      }),

      required: ScalarNode.create({
        type: 'bool',
        label: 'Required:',
        transactionalField: true,
        defaultValue: false,
        required: true,
        input: CheckBox
      }),

      identifiable: ScalarNode.create({
        type: 'bool',
        label: 'Identifiable:',
        transactionalField: true,
        defaultValue: false,
        required: true,
        input: CheckBox
      }),

      explanation: ScalarNode.create({
        label: 'Explanation:',
        transactionalField: true,
        defaultValue: 'none',
        required: false,
        input: TERNARY_VALUE_SELECT
      }),

      annotation: ScalarNode.create({
        label: 'Annotation:',
        transactionalField: true,
        defaultValue: 'none',
        required: false,
        input: TERNARY_VALUE_SELECT
      }),

      type: TypeObjectNode.create({allowComplexTypes})
    });

  }
}

class InstrumentNode extends MappingNode {

  getDefaultProps() {
    return {component: Instrument};
  }

  getChildren() {
    return OrderedMap({
      id: ScalarNode.create(),
      title: ScalarNode.create({
        label: 'Instrument Title:',
        defaultValue: 'Untitled Instrument',
        required: true
      }),
      version: ScalarNode.create(),
      types: ScalarNode.create(),
      record: ListNode.create({
        component: InstrumentRecordList,
        label: 'Fields:',
        children: InstrumentRecordNode.create({allowComplexTypes: true})
      })
    });
  }
}

module.exports = InstrumentNode;
module.exports.InstrumentRecordNode = InstrumentRecordNode;
module.exports.SIMPLE_TYPES = SIMPLE_TYPES;
module.exports.COMPLEX_TYPES = COMPLEX_TYPES;

