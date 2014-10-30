/**
 * @jsx React.DOM
 */
'use strict';

var React                             = require('react');
var cx                                = React.addons.classSet;
var ReactForms                        = require('react-forms');
var {Mapping, List, Scalar, Dynamic}  = ReactForms.schema;
var {Vector, Map}                     = require('immutable');
var Select                            = require('./Select');
var FieldTypeSelect                   = require('./FieldTypeSelect');
var EventTypeSelect                   = require('./EventTypeSelect');
var AddlResponseSelect                = require('./AddlResponseSelect');
var Button                            = require('./Button');
var ButtonGroup                       = require('./ButtonGroup');
var {SimpleScalar, HiddenScalar,
     OptionalList, validateIdentifier,
     AsIsValueType, ReadOnlyScalar}   = require('./FormHelpers');
var localization                      = require('./localization');
var LocalizedStringInput              = require('./LocalizedStringInput');
var CustomRepFieldset                 = require('./CustomRepFieldset');
var ElementTypeSelect                 = require('./ElementTypeSelect');
var Autocomplete                      = require('./Autocomplete');
var merge                             = require('./merge');
var buildRecordIndex                  = require('./buildRecordIndex');
var TargetFieldset                    = require('./TargetFieldset');

var PageElementsFieldset = React.createClass({

  render() {
    return this.transferPropsTo(
      <CustomRepFieldset
        ref="fieldset"
        renderHead={this.renderHead}
        renderFooter={this.renderFooter}
        />
    );
  },

  renderFooter() {
    var addQuestionDisabled = this.state.fieldToAdd ? false : true;
    var records = this.props.value.schema.props.get('records').keySeq();
    var options = records.map((id) => ({id, title: id})).toJS();
    return (
      <div className="rfb-PageElementsFieldset__customFooter">
        <div className="rfb-PageElementsFieldset__addQuestion">
          <Button
            className="btn-sm"
            style="primary"
            onClick={this.onAddQuestion}
            disabled={addQuestionDisabled}>
            Add Question For:
          </Button>
          <Autocomplete
            placeholder="Field Id"
            options={options}
            onChange={this.onFieldToAddChanged}
            dropUp={true}
            value={this.state.fieldToAdd || null}
            className="rfb-add-question-for"
            />
        </div>
        <ButtonGroup>
          <Button className="btn-sm" onClick={this.onAddHeader}>Add Header</Button>
          <Button className="btn-sm" onClick={this.onAddText}>Add Text</Button>
          <Button className="btn-sm" onClick={this.onAddDivider}>Add Divider</Button>
        </ButtonGroup>
      </div>
    )
  },

  renderHead() {
    var cls = {
      'rfb-CustomRepFieldset__head': true,
      'rfb-questions-only': this.props.questionsOnly
    }
    return (
      <div className={cx(cls)}>
        <div className="rfb-CustomRepFieldset__add">
          {this.props.questionsOnly &&
            <div className="rfb-PageElementsFieldset__title">Questions:</div>}
        </div>
        <div className="rfb-CustomRepFieldset__elementsTitle">
        </div>
      </div>
    );
  },

  getInitialState() {
    return {
      fieldToAdd: null
    };
  },

  onAddQuestion() {
    if (this.state.fieldToAdd) {
      this.refs.fieldset.addAndScroll({
        type: "question",
        options: {
          fieldId: this.state.fieldToAdd.id
        }
      });
    }
  },

  onAddHeader() {
    this.refs.fieldset.addAndScroll({type: "header"});
  },

  onAddText() {
    this.refs.fieldset.addAndScroll({type: "text"});
  },

  onAddDivider() {
    this.refs.fieldset.addAndScroll({type: "divider"});
  },

  onFieldToAddChanged(variant) {
    this.setState({fieldToAdd: variant || null});
    return variant;
  }
});

var QuestionsFieldset = React.createClass({

  render() {
    return this.transferPropsTo(
      <CustomRepFieldset
        ref="fieldset"
        className="rfb-QuestionsFieldset"
        renderHead={this.renderHead}
        renderFooter={this.renderFooter}
        />
    );
  },

  renderFooter() {
    var addQuestionDisabled = this.state.fieldToAdd ? false : true;
    var records = this.props.value.schema.props.get('records').keySeq();
    var options = records.map((id) => ({id, title: id})).toJS();
    return (
      <div className="rfb-QuestionsFieldset__addQuestion">
        <Button
          className="btn-sm"
          style="primary"
          onClick={this.onAddQuestion}
          disabled={addQuestionDisabled}>
          Add Question For:
        </Button>
        <Autocomplete
          placeholder="Field Id"
          options={options}
          onChange={this.onFieldToAddChanged}
          dropUp={true}
          value={this.state.fieldToAdd || null}
          className="rfb-add-question-for"
          />
      </div>
    )
  },

  renderHead() {
    return (
      <div className="rfb-CustomRepFieldset__head rfb-QuestionsFieldset__head">
        <div className="rfb-CustomRepFieldset__add">
        </div>
        <div className="rfb-CustomRepFieldset__elementsTitle">
          Questions:
        </div>
      </div>
    );
  },

  getInitialState() {
    return {
      fieldToAdd: null
    };
  },

  onAddQuestion() {
    if (this.state.fieldToAdd) {
      this.refs.fieldset.addAndScroll({
        fieldId: this.state.fieldToAdd.id
      });
    }
  },

  onFieldToAddChanged(variant) {
    this.setState({fieldToAdd: variant || null});
    return variant;
  }

});

var PageFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className="rfb-PageFieldset">
        <ReactForms.Element value={value.child('id')} />
        <hr />
        <div className="rfb-PageFieldset__elements" >
          <ReactForms.Element value={value.child('elements')} />
        </div>
      </div>
    );
  }
});

var ElementFieldset = React.createClass({

  render() {
    var {value} = this.props;
    return (
      <div className={cx('rfb-ElementFieldset',
                         'rfb-ElementFieldset-' + value.value.get('type'))}>
        {this.renderElementHead()}
        <ReactForms.Element value={value.child('options')} />
      </div>
    );
  },

  renderElementTitle() {
    var {value: {value}} = this.props;
    switch (value.get('type')) {
      case 'question':
        // TODO: implement scrolling to the satisfied field on the sidebar when
        // clicking by the fieldId link
        /*
        return (
          <span>
            Question: <a href="#">{value.get('options').get('fieldId')}</a>
          </span>
        );
        */
        return 'Question: ' + value.get('options').get('fieldId');
      case 'header':
        return 'Header';
      case 'text':
        return 'Text';
      case 'divider':
        return 'Divider';
    }
  },

  renderElementHead() {
    return (
      <div className="rfb-ElementFieldset__head">
        <div className="rfb-ElementFieldset__border">
          {this.renderElementTitle()}
        </div>
        <div className="rfb-ElementFieldset__spacer" />
      </div>
    );
  }
});

var ChannelFormFieldset = React.createClass({

  render() {
    var {value} = this.props;
    var active = value.schema.props.get('active');
    var enabled = value.schema.props.get('enabled');
    var onToggleChannel = value.schema.props.get('onToggleChannel');
    var classes = cx({
      'rfb-ChannelForm': true,
      'rfb-ChannelForm--enabled': enabled,
      'rfb-active': active
    });
    return (
      <div className={classes}>
        <div className="rfb-ChannelForm-head">
          <div className="rfb-ChannelForm-enableChkBox">
            Enabled: <input type="checkbox" checked={enabled} onChange={onToggleChannel} />
          </div>
          {enabled && <ReactForms.Element value={value.child("defaultLocalization")} />}
          {enabled && <ReactForms.Element value={value.child("title")} />}
        </div>
        <div className="rfb-ChannelForm-body">
          {enabled && <ReactForms.Element value={value.child("pages")} />}
        </div>
      </div>
    );
  }
});

function InstrumentRefSchema(props) {
  return Mapping(props, {
    id: HiddenScalar(),
    version: HiddenScalar()
  });
}

function ElementTypeSchema(props) {
  return Scalar({
    label: 'Type:',
    defaultValue: 'question',
    input: <ElementTypeSelect />,
    required: true
  });
}

function ActionSchema(props) {
  return Scalar({
    label: 'Action:',
    defaultValue: 'hide',
    input: <EventTypeSelect />,
    required: true
  });
}

function cleanEmptyLists(v) {
  var lists = ['enumerations', 'rows', 'questions', 'events'];
  lists.forEach((name) => {
    var l = v.get(name);
    if (l && l.length === 0)
      v = v.remove(name);
  });
  return v;
}

function ElementOptionsSchema(children) {
  var component = <ReactForms.Fieldset className="rfb-ElementOptionsFieldset" />;
  return Mapping({component, onUpdate:cleanEmptyLists, required: true}, children);
}

function DividerElementSchema(props) {
  return Mapping({component: ElementFieldset}, {
    type: ElementTypeSchema(),
    options: ElementOptionsSchema({}),
    tags: SimpleScalar()
  });
}

function TextualElementSchema(props) {
  return Mapping({component: ElementFieldset}, {
    type: ElementTypeSchema(),
    options: ElementOptionsSchema({
      text: Scalar({
        required: true,
        label: "Text:",
        type: localization.LocalizedStringType,
        input: (
          <LocalizedStringInput
            localizations={props.localizations}
            multiline={true}
            />
        )
      })
    }),
    tags: SimpleScalar()
  });
}

function QuestionSchema({record, localizations}) {
  var type = record.get('type');
  if (typeof type !== 'string') {
    type = type.get('base');
  }

  var hasQuestions = false;
  var records;

  if (type === 'recordList' || type === 'matrix') {
    hasQuestions = true;
    records = record.getIn(
      ['type', type === 'recordList' ? 'record' : 'columns'],
      Vector.empty())
    records = buildRecordIndex(records);
  }

  return  ElementOptionsSchema({
    fieldId: ReadOnlyScalar({label:"FieldId:"}), /* SimpleScalar(), */
    text: Scalar({
      required: true,
      label: "Text:",
      type: localization.LocalizedStringType,
      input: (
        <LocalizedStringInput
          localizations={localizations}
          multiline={true}
          />
      )
    }),
    help: Scalar({
      label: "Help:",
      type: localization.LocalizedStringType,
      input: (
        <LocalizedStringInput
          localizations={localizations}
          multiline={true}
          />
      )
    }),
    error: Scalar({
      label: "Error:",
      type: localization.LocalizedStringType,
      input: (
        <LocalizedStringInput
          localizations={localizations}
          multiline={true}
          />
      )
    }),
    questions: hasQuestions && ListOfQuestionsSchema({localizations, records}),
    rows: type === 'matrix' && ListOfRows({
      localizations,
      rows: record.getIn(['type', 'rows'], Vector.empty())
    }),
    enumerations: (type === 'enumeration' || type === 'enumerationSet') &&
      EnumerationsSchema({
        enumerations: record.getIn(['type', 'enumerations'], Vector.empty())
      }),
    widget: SimpleScalar(),
    events: EventsSchema()
  });
}

function DynamicQuestionSchema({records, localizations}) {
  return Dynamic(function(value) {
    var fieldId = value.get('fieldId');
    var record = records.get(fieldId);
    if (record !== undefined) {
      return QuestionSchema({localizations, record});
    }
  });
}

function QuestionElementSchema({localizations, record}) {
  return Mapping({component: ElementFieldset}, {
    type: ElementTypeSchema(),
    options: QuestionSchema({localizations, record}),
    tags: SimpleScalar()
  });
}

function validateListOfQuestions(v) {
  if (!v || v.length == 0)
    return new Error('Empty list of questions');
  return true;
}

function ListOfQuestionsSchema({localizations, records}) {
  var component = (
    <QuestionsFieldset
      className="rfb-PageElements"
      noItemsTitle="At least one question should be added"
      addTitle="Add Question"
      />
  );
  return List({
      defaultValue: [],
      validate: validateListOfQuestions,
      component,
      records
    },
    DynamicQuestionSchema({localizations, records}))
}

function ListOfRows({localizations, rows}) {
  var getWarning = function (value) {
    var used = {};
    if (rows) {
      rows = rows.toJS();
      rows.forEach((row) => {
        used[row.id] = 0;
      });
    }
    var total = value.value.length;
    for (var i = 0; i < total; i++) {
      var item = value.value.get(i);
      var id = item.get('id');
      if (used.hasOwnProperty(id))
        ++used[id];
    }
    for (var id in used) {
      if (used.hasOwnProperty(id) && used[id] == 0)
        return 'Not all defined rows are used!';
    }
    return null;
  }
  var component = (
    <CustomRepFieldset
      elementsTitle="Rows:"
      className="rfb-Enumerations"
      addTitle="Add Row"
      getWarning={getWarning}
      floatAddButton={true}
      noItemsTitle="No Rows"
      />
  );
  var variants = rows.map((row) => row.get('id')).toJS()
  var defaultValue = variants.map((id) => ({id}));
  return List({defaultValue, component},
    DescriptorSchema({localizations, variants}));
}

function EnumerationsSchema({localizations, enumerations}) {
  var component = (
    <CustomRepFieldset
      elementsTitle="Enumerations:"
      className="rfb-Enumerations"
      addTitle="Add Enumeration"
      noItemsTitle="No Enumerations"
      floatAddButton={true}
      />
  );

  var plain = enumerations.toJS();
  var variants = [];
  for (var name in plain) {
    if (plain.hasOwnProperty(name)) {
      variants.push(name)
    }
  }
  var validate = function (v) {
    var used = {};
    var wrong = [];
    v.forEach((item) => {
      var id = item.get('id');
      if (used[id] || variants.indexOf(id) == -1)
        wrong.push(id);
      used[id] = true;
    });
    if (wrong.length)
      return new Error('Duplicated or wrong identifiers: ' + wrong.join(', '));
    return true;
  };
  return List({component, validate},
              DescriptorSchema({localizations, variants}));
}

function DescriptorSchema({localizations, variants}) {
  var options = variants.map((name) => {
    return {
      id: name,
      title: name
    }
  });
  return Mapping({}, {
    id: Scalar({
      label: 'Id:',
      required: true,
      defaultValue: variants.length ? variants[0]: undefined,
      input: (
        <Select options={options}
                wrongToEmpty={true}
                emptyValue={null} />
      )
    }),
    text: Scalar({
      required: true,
      label: "Text:",
      type: localization.LocalizedStringType,
      input: (
        <LocalizedStringInput
          localizations={localizations}
          multiline={true}
          />
      )
    }),
    help: Scalar({
      label: "Help:",
      type: localization.LocalizedStringType,
      input: (
        <LocalizedStringInput
          localizations={localizations}
          multiline={true}
          />
      )
    })
  })
}

function ElementSchema({localizations, records}) {
  return Dynamic(function(value) {
    var key = value.get('type', 'question');
    switch (key) {
      case 'question':
        var fieldId = value.getIn(['options', 'fieldId']);
        var record = records.get(fieldId);
        if (record !== undefined) {
          return QuestionElementSchema({localizations, record});
        } else {
          return;
        }
      case 'text':
      case 'header':
        return TextualElementSchema({localizations});
      case 'divider':
        return DividerElementSchema({localizations});
      default:
        console.error('invalid key: ', key);
    }
  });
}

function validateElements(v) {
  if (!v || v.length == 0) {
    return new Error('At least one page element should be provided on a page');
  }
};

function ListOfElements({localizations, records}) {
  var component = (
    <PageElementsFieldset
      className="rfb-PageElements"
      noItemsTitle="At least one element should be added"
      addTitle="Add Element"
      />
  );
  return List({defaultValue: [], component, validate: validateElements, records, forceUpdate: false},
    ElementSchema({localizations, records}))
}

function validatePage(v) {
  if (!v || !/^[a-z](?:[a-z0-9]|[_-](?![_-]))*[a-z0-9]$/.test(v)) {
    return new Error('Wrong page identifier');
  }
  return true;
}

function PageSchema({localizations, records}) {
  var defaultValue = {elements: []};
  return Mapping({defaultValue, component: PageFieldset, forceUpdate: false}, {
    id: Scalar({label: 'Page ID:', required: true, validate: validatePage}),
    elements: ListOfElements({localizations, records})
  });
}

function validateExpression(v) {
  // TODO: ...
  return true;
}

function cleanEmptyEventLists(v) {
  var lists = ['tags', 'targets'];
  lists.forEach((name) => {
    var l = v.get(name);
    if (l && l.length === 0)
      v = v.remove(name);
  });
  return v;
}

function validateTargets(v) {
  var used = {};
  var wrong = [];
  v.forEach((item, idx) => {
    if (used[item] || !item || validateIdentifier(item) instanceof Error)
      wrong.push(item);
    used[item] = true;
  });
  if (wrong.length)
    return new Error('Duplicated or wrong identifiers: ' + wrong.join(', '));
  return true;
}

function EventsSchema(props) {
  var eventsComponent = (
    <CustomRepFieldset
      elementsTitle="Events:"
      className="rfb-Events"
      addTitle="Add Event"
      noItemsTitle="No Events"
      floatAddButton={true}
      />
  );
  return List({
      component: eventsComponent,
      type: OptionalList
    },
    Mapping({onUpdate: cleanEmptyEventLists}, {
      trigger: Scalar({label: 'Trigger:', required: true, validate: validateExpression}),
      action: ActionSchema(props),
      targets: Scalar({
        type: AsIsValueType,
        validate: validateTargets,
        label: "Targets:",
        component: <TargetFieldset />
      }),
      options: SimpleScalar(),
    })
  );
}

function ListOfPagesSchema({localizations, records}) {
  var component = (
    <CustomRepFieldset
      className="rfb-ChannelPages"
      noItemsTitle="At least one page should be defined"
      addTitle="Add Page"
      />
  );
  var validate = function (v) {
    if (!v || v.length == 0)
      return new Error('At least one page should be set');
    return true;
  };
  return List({component, validate, forceUpdate: false},
    PageSchema({localizations, records}))
}

function ChannelSchema(props) {
  var defaultValue = {pages: []};
  props = merge(props || {}, {defaultValue, component: ChannelFormFieldset, forceUpdate: false});
  var localizationOptions = props.localizations ?
    localization.buildOptions(props.localizations) :
    undefined;
  var defaultLocalization = null;
  if (props.localizations['en'])
    defaultLocalization = 'en';
  else if (localizationOptions.length)
    defaultLocalization = localizationOptions[0].id;

  var children = !props.enabled ? {}: {
    instrument: InstrumentRefSchema({defaultValue: props.instrumentRef}),

    defaultLocalization: Scalar({
      required: true,
      label: 'Default Localization:',
      input: <localization.LocalizationSelect options={localizationOptions} />,
      defaultValue: defaultLocalization
    }),

    title: Scalar({
      label: 'Form Title:',
      type: localization.LocalizedStringType,
      input: <LocalizedStringInput localizations={props.localizations} />
    }),

    tags: SimpleScalar(),

    unprompted: SimpleScalar(),

    parameters: SimpleScalar(),

    pages: ListOfPagesSchema(props)
  };

  return Mapping(props, children);
};

module.exports = ChannelSchema;
