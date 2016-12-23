/**
 * @flow
 */

import type {Expression} from '../../model/Query';
import type {Navigation} from '../../model/navigation';

import invariant from 'invariant';
import React from 'react';
import * as ReactUI from '@prometheusresearch/react-ui';
import {HBox, Element} from 'react-stylesheet';
import debounce from 'lodash/debounce';

import Select from '../Select';
import TagLabel from '../TagLabel';
import Label from '../Label';
import * as nav from '../../model/navigation';
import * as FilterComparators from './FilterComparators';

type FilterConditionProps = {
  expression: Expression;
  fields: Array<nav.Navigation>;
  onUpdate: (expression: Expression) => *;
};

type FilterConditionState = {|
  fieldName: ?string;
  operandName: ?string;
  comparatorName: ?string;
  operandIsField: boolean;
|};

export default class FilterCondition
  extends React.Component<*, FilterConditionProps, *> {

  state: FilterConditionState;

  constructor(props: FilterConditionProps) {
    super(props);
    this.state = getCondition(props.expression);
  }

  render() {
    let {fields, expression} = this.props;
    let {fieldName, comparatorName, operandName, operandIsField} = this.state;
    let field = null;

    if (expression.context.type.name === 'invalid') {
      return (
        <Element fontSize="10pt" fontWeight={300} textAlign="center">
          <Element display="inline-block" marginRight={5}>
            {fieldName}
          </Element>
          <Element display="inline-block" marginRight={5}>
            {comparatorName}
          </Element>
          <Element display="inline-block">
            {operandName}
          </Element>
        </Element>
      );
    }

    let comparators = [];
    if (fieldName != null) {
      field = getFieldDefinition(fields, fieldName);
      comparators = FilterComparators.getApplicableForField(field);
    }

    let operandComponent = null;
    let chooseOperandType = true;
    if (field != null && comparatorName != null) {
      let operandFields = getCompatibleOperandFields(fields, field).map(field => ({
        label: field.label,
        value: field.value,
      }));
      chooseOperandType = operandFields.length > 0;

      if (chooseOperandType && operandIsField && operandName) {
        operandComponent = (
          <Select
            value={operandName}
            options={operandFields}
            onChange={this.onOperandValueChange}
            placeholder="Select an Attribute..."
            />
        );
      } else {
        let comparatorDefinition = FilterComparators.getDefinition(comparatorName);
        invariant(
          comparatorDefinition != null,
          'Cannot find comparator definition for: %s', comparatorName
        );
        operandComponent = comparatorDefinition.operand(
          field,
          operandName,
          this.onOperandValueChange,
        );
      }

      if (field.context.type.name === 'record') {
        chooseOperandType = false;
      }

    }

    let operandTypeOptions = [
      {label: 'Constant Value', value: 'value'},
      {label: 'Attribute', value: 'field'},
    ];

    let fieldOptions = fields.map(field => ({
      labelActive: field.label,
      label: field.fromQuery
        ? <HBox>
            <HBox flexGrow={1} flexShrink={1}>
              <Label label={field.label} />
            </HBox>
            <TagLabel>query</TagLabel>
          </HBox>
        : field.label,
      value: field.value,
    }));

    return (
      <ReactUI.Block>
        <ReactUI.Block>
          <ReactUI.Block marginBottom={5}>
            <Select
              value={fieldName}
              options={fieldOptions}
              onChange={this.onFieldChange}
              />
          </ReactUI.Block>
          {fieldName != null &&
            <ReactUI.Block marginBottom={5}>
              <Select
                clearable={false}
                value={comparatorName}
                options={comparators}
                onChange={this.onComparatorChange}
                />
            </ReactUI.Block>
          }
        </ReactUI.Block>
        {operandComponent &&
          <ReactUI.Block>
            {chooseOperandType &&
              <ReactUI.Block marginBottom={5}>
                <ReactUI.RadioGroup
                  layout="horizontal"
                  options={operandTypeOptions}
                  value={operandIsField ? 'field' : 'value'}
                  onChange={this.onOperandTypeChange}
                  />
              </ReactUI.Block>}
            {operandComponent}
          </ReactUI.Block>
        }
      </ReactUI.Block>
    );
  }

  componentWillReceiveProps(nextProps: FilterConditionProps) {
    this.setState({
      ...getCondition(nextProps.expression),
      comparatorName: this.state.comparatorName,
    });
  }

  onFieldChange = (newField: string) => {
    let {
      fieldName,
      comparatorName,
      operandName,
      operandIsField
    } = this.state;

    let prevField = fieldName;
    fieldName = newField;

    let newFieldDef = newField
      ? getFieldDefinition(this.props.fields, newField)
      : null;

    if (newFieldDef) {
      let newComp = null;
      FilterComparators.getApplicableForField(newFieldDef).forEach(comp => {
        if (comp.value === comparatorName) {
          return comp;
        }
      });

      let prevFieldDef = prevField
        ? getFieldDefinition(this.props.fields, prevField)
        : null;

      if (!newComp) {
        comparatorName = null;
        operandName = null;
        operandIsField = false;
      } else if (
        prevFieldDef &&
        newFieldDef &&
        (prevFieldDef.context.type !== newFieldDef.context.type)
      ) {
        operandName = null;
        operandIsField = false;
      }
    } else {
      comparatorName = null;
      operandName = null;
      operandIsField = false;
    }

    if (newFieldDef && comparatorName == null) {
      let comparators = FilterComparators.getApplicableForField(newFieldDef)
      if (comparators.length > 0) {
        comparatorName = comparators[0].value;
      }
    }

    this.setState({
      fieldName,
      comparatorName,
      operandName,
      operandIsField
    }, () => this.updateQuery());
  };

  onComparatorChange = (comparatorName: string) => {
    this.setState({
      comparatorName,
      operandName: null,
      operandIsField: false,
    }, () => this.updateQuery());
  };

  onOperandTypeChange = (newType: string) => {
    this.setState({
      operandIsField: newType === 'field',
      operandName: null
    }, () => this.updateQuery());
  };

  onOperandValueChange = (newOperand: ?string) => {
    this.setState({
      operandName: newOperand,
    }, () => this.updateQuery());
  };

  updateQuery = debounce(() => {
    let {
      fieldName,
      comparatorName,
      operandName,
      operandIsField
    } = this.state;

    invariant(
      comparatorName != null,
      'Comparator name is null'
    );

    invariant(
      fieldName != null,
      'Field is null'
    );

    let field = getFieldDefinition(this.props.fields, fieldName);

    let comparatorDefinition = FilterComparators.getDefinition(comparatorName);

    invariant(
      comparatorDefinition != null,
      'Cannot find comparator definition for: %s', comparatorName
    );

    let query = comparatorDefinition.query(
      field,
      operandName,
      operandIsField
    );

    if (query) {
      this.props.onUpdate(query);
    }
  }, 750);
}

function getCompatibleOperandFields(
  fieldList: Array<Navigation>,
  field: Navigation
) {
  if (field.context.type.name === 'invalid') {
    return [];
  } else {
    return fieldList.filter(f =>
      f.context.type.name !== 'invalid' &&
      f.value !== field.value &&
      f.context.type.name === field.context.type.name
    );
  }
}

function getFieldDefinition(
  fieldList: Array<Navigation>,
  fieldName: string
): Navigation {
  for (let i = 0; i < fieldList.length; i++) {
    let field = fieldList[i];
    if (field.value === fieldName) {
      return field;
    }
  }

  invariant(
    false,
    'No field named "%s" found in current scope.', fieldName
  );
}

function getCondition(expression: Expression): FilterConditionState {
  if (expression.name === 'value' && expression.value === true) {
    return {
      fieldName: null,
      comparatorName: null,
      operandName: null,
      operandIsField: false
    };
  }

  let condition = FilterComparators.identify(expression);

  invariant(
    condition,
    'Cannot identify expression type.'
  );

  return {
    fieldName: condition.field,
    operandName: condition.operand,
    comparatorName: condition.comparator,
    operandIsField: condition.operandIsField,
  };
}
