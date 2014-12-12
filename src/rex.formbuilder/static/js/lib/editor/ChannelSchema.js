/**
 * @jsx React.DOM
 */
'use strict';

var React                               = require('react');
var ReactForms                          = require('react-forms');
var {Option}                            = require('react-autocomplete');
var {OrderedMap, Map, List}             = require('immutable');
var {ListNode, ScalarNode, MappingNode} = ReactForms.schema;
var Select                              = require('../Select');
var LocalizedString                     = require('../LocalizedString');
var ReadOnlyField                       = require('../ReadOnlyField');
var merge                               = require('../merge');
var RepeatingFieldset                   = require('./RepeatingFieldset');
var Channel                             = require('./Channel');
var ChannelPage                         = require('./ChannelPage');
var ChannelPageList                     = require('./ChannelPageList');
var InstrumentStore                     = require('./InstrumentStore');
var QuestionEnumList                    = require('./QuestionEnumList');
var QuestionRowList                     = require('./QuestionRowList');
var EventList                           = require('./EventList');
var NestedQuestionList                  = require('./NestedQuestionList');

var EMPTY_MAP = Map();

var ELEMENT_TYPES = {
  QUESTION: 'question',
  TEXT: 'text',
  HEADER: 'header',
  DIVIDER: 'divider'
};

var ELEMENT_TYPE_SELECT = (
  <Select
    emptyValue={false}
    options={Select.optionsFromObject(ELEMENT_TYPES)}
    />
);

var EVENT_TYPES = {
  HIDE: 'hide',
  DISABLE: 'disable',
  HIDE_ENUMERATION: 'hideEnumeration',
  FAIL: 'fail',
  CALCULATE: 'calculate'
};

var EVENT_TYPE_SELECT = (
  <Select
    emptyValue={false}
    options={Select.optionsFromObject(EVENT_TYPES)}
    />
);

function LocalizationSelect(props) {
  var {localizations} = props;
  var options = [];
  localizations.map((title, id) => {
    options.push({id, title});
  });
  return <Select
    emptyValue={false}
    options={options}
  />
}

class ElementNode extends ReactForms.schema.Node {

  get defaultValue() {
    return Map({
      type: 'question',
      options: Map()
    });
  }

  instantiate(value) {
    var node = this.instantiateNode(value);
    return {value, node};
  }

  instantiateNode(value) {
    var type = value && value.get ?
      value.get('type', ELEMENT_TYPES.QUESTION) :
      ELEMENT_TYPES.QUESTION;
    switch (type) {
      case ELEMENT_TYPES.TEXT:
        return TextElementNode.create(this.props);
      case ELEMENT_TYPES.HEADER:
        return HeaderElementNode.create(this.props);
      case ELEMENT_TYPES.DIVIDER:
        return DividerElementNode.create(this.props);
      case ELEMENT_TYPES.QUESTION:
        return QuestionElementNode.create(this.props);
    }
  }
}


class LocalizedStringNode extends MappingNode {

  getDefaultProps() {
    return {
      component: LocalizedString
    };
  }

  getChildren() {
    var localizations = this.props.get('localizations') || OrderedMap({en: 'English'});
    return localizations.map(_ => ScalarNode.create());
  }
}

class TextOptionsNode extends MappingNode {

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      text: LocalizedStringNode.create({
        required: true,
        label: "Text:",
        localizations
      })
    });
  }
}

class TextElementNode extends MappingNode {

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      type: ScalarNode.create({
        required: true,
        component: ReadOnlyField,
        // input: ELEMENT_TYPE_SELECT,
        defaultValue: 'text'
      }),
      options: TextOptionsNode.create({localizations})
    });
  }
}

class HeaderElementNode extends MappingNode {

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      type: ScalarNode.create({
        required: true,
        component: ReadOnlyField,
        // input: ELEMENT_TYPE_SELECT,
        defaultValue: 'header'
      }),
      options: TextOptionsNode.create({localizations})
    });
  }
}

class DividerElementNode extends MappingNode {

  getChildren() {
    return OrderedMap({
      type: ScalarNode.create({
        required: true,
        component: ReadOnlyField,
        // input: ELEMENT_TYPE_SELECT,
        defaultValue: 'divider'
      })
    });
  }
}

class QuestionElementNode extends MappingNode {
  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      type: ScalarNode.create({
        required: true,
        component: ReadOnlyField,
        // input: ELEMENT_TYPE_SELECT,
        defaultValue: 'question'
      }),
      options: QuestionObjectNode.create({localizations})
    });
  }
}

class BaseQuestionObjectNode extends MappingNode {

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      fieldId: ScalarNode.create({
        label: "Field ID:",
        required: true,
        component: ReadOnlyField
      }),
      text: LocalizedStringNode.create({
        multiline: true,
        label: "Text:",
        required: true,
        localizations
      }),
      help: LocalizedStringNode.create({
        multiline: true,
        label: "Help:",
        localizations
      }),
      error: LocalizedStringNode.create({
        multiline: true,
        label: "Error:",
        localizations
      }),
      widget: ScalarNode.create({
        label: "widget:"
      }),
      events: ListNode.create({
        component: EventList,
        label: "Events:",
        children: EventNode.create({localizations})
      })
    });
  }
}

class MatrixQuestionObjectNode extends BaseQuestionObjectNode {
  getChildren() {
    var localizations = this.props.get('localizations');
    var path = this.props.get('path');
    return super()
      .set('rows', ListNode.create({
        component: require('./QuestionRowList'),
        label: 'Rows:',
        children: DescriptionNode.create({localizations})
      }))
      .set('questions', ListNode.create({
        component: NestedQuestionList,
        label: "Questions:",
        children: QuestionObjectNode.create({path, localizations})
      }));
  }
}

class RecordListQuestionObjectNode extends BaseQuestionObjectNode {
  getChildren() {
    var localizations = this.props.get('localizations');
    var path = this.props.get('path');
    return super()
      .set('questions', ListNode.create({
        component: NestedQuestionList,
        label: "Questions:",
        children: QuestionObjectNode.create({path, localizations})
      }));
  }
}

class EnumQuestionObjectNode extends BaseQuestionObjectNode {
  getChildren() {
    var localizations = this.props.get('localizations');
    return super()
      .set('enumerations', ListNode.create({
        component: QuestionEnumList,
        label: "Enumerations:",
        children: DescriptionNode.create({localizations})
      }));
  }
}

class QuestionObjectNode extends ReactForms.schema.Node {

  getDefaultProps() {
    return {path: null};
  }

  instantiate(value) {
    var node = this.instantiateNode(value);
    return {value, node};
  }

  instantiateNode(value) {
    if (!value.get) {
      console.error('value without get', value);
    }
    var fieldId = value.get('fieldId');
    var path = this.props.get('path');
    path = path ? path.push(fieldId) : List.of(fieldId);
    var record = InstrumentStore.getRecord(path);
    if (record === null) {
      console.error('can not find record:', path.toJS());
    }
    var type = record.get('type');
    if (type instanceof Object)
      type = type.get('base');
    var props = this.props.merge({path});
    // TODO: find a better way to get and handle the type:
    //  there could be custom defined types
    switch (type) {
    case 'recordList':
      return new RecordListQuestionObjectNode(props);
    case 'matrix':
      return new MatrixQuestionObjectNode(props);
    case 'enumeration':
    case 'enumerationSet':
      return new EnumQuestionObjectNode(props);
    }
    return new BaseQuestionObjectNode(props);
  }
}

class DescriptionNode extends MappingNode {

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      id: ScalarNode.create({
        label: 'Identifier:',
        required: true,
        component: ReadOnlyField
      }),
      text: LocalizedStringNode.create({
        multiline: true,
        label: "Text:",
        required: true,
        localizations
      }),
      help: LocalizedStringNode.create({
        multiline: true,
        label: "Help:",
        localizations
      }),
    });
  }
}

class EventNode extends MappingNode {

  getChildren() {
    return OrderedMap({
      trigger: ScalarNode.create({
        label: 'Trigger:',
        required: true,
      }),
      action: ScalarNode.create({
        label: 'Action:',
        input: EVENT_TYPE_SELECT,
        required: true,
      }),
      targets: ScalarNode.create({
        label: 'Targets:',
        required: true,
      }),
      options: ScalarNode.create({
        label: 'Options:',
        required: true,
      }),
    });
  }
}

class ChannelPageNode extends MappingNode {

  getDefaultProps() {
    return {
      component: ChannelPage,
      transactionalFieldset: true
    };
  }

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      id: ScalarNode.create({
        label: 'Page ID:',
        transactionalField: true,
        required: true,
      }),
      elements: ListNode.create({
        component: require('./ChannelElementList'),
        label: 'Elements:',
        children: ElementNode.create({localizations})
      })
    });
  }

}

class ChannelNode extends MappingNode {

  getDefaultProps() {
    return {component: Channel};
  }

  getChildren() {
    var localizations = this.props.get('localizations');
    return OrderedMap({
      instrument: ScalarNode.create(),
      defaultLocalization: ScalarNode.create({
        label: 'Default Localization:',
        defaultValue: 'en',
        required: true,
        input: LocalizationSelect({localizations})
      }),
      title: LocalizedStringNode.create({
        localizations,
        label: 'Title:'
      }),
      tags: ScalarNode.create(),
      unprompted: ScalarNode.create(),
      parameters: ScalarNode.create(),

      pages: ListNode.create({
        component: ChannelPageList,
        label: 'Pages:',
        children: ChannelPageNode.create({localizations})
      })

    });
  }
}


module.exports = ChannelNode;
