/**
 * @flow
 */

import type {FilterQuery, QueryOrLiteral} from '../model/Query';
import type {QueryPointer} from '../model/QueryPointer';
import type {Actions} from '../state';
import type {Comparator} from './FilterComparators';

import invariant from 'invariant';
import React from 'react';
import CloseIcon from 'react-icons/lib/fa/close';
import * as ReactUI from '@prometheusresearch/react-ui';
import debounce from 'lodash/debounce';

import * as comp from './FilterComparators';
import * as t from '../model/Type';
import * as q from '../model/Query';
import * as nav from '../model/navigation';
import * as theme from './Theme';
import QueryPanelBase from './QueryPanelBase';
import {MenuGroup, MenuButton} from './menu';
import Select from './Select';


type FilterConditionProps = {
  expression: QueryOrLiteral;
};


class FilterCondition extends React.Component {
  state: {field: ?string, operand: ?string, comparator: ?string};

  constructor(props: FilterConditionProps) {
    super(props);

    let condition = this.getCondition(props.expression);

    this.state = {...condition};
  }

  componentWillReceiveProps(nextProps: FilterConditionProps) {
    let condition = this.getCondition(nextProps.expression);
    this.setState({
      ...condition
    });
  }

  getCondition(expression): Comparator {
    if (expression === true) {
      return {field: null, comparator: null, operand: null};
    }

    let condition = comp.identify(expression);
    invariant(condition, 'Cannot identify expression type.');

    return condition;
  }

  getFieldDefinition(fieldName) {
    for (let i = 0; i < this.props.fields.length; i++) {
      let field = this.props.fields[i];
      if (field.value === fieldName) {
        return field;
      }
    }

    invariant(false, 'No field named "%s" found in current scope.', fieldName);
  }

  render() {
    let {fields} = this.props;
    let {field, comparator, operand} = this.state;
    let fieldDef = null;

    let comparators = [];
    if (field) {
      fieldDef = this.getFieldDefinition(field);
      comparators = comp.getApplicableForField(fieldDef);
    }

    let operandComponent = null;
    if (fieldDef && comparator) {
      let comparatorDefinition = comp.getDefinition(comparator);
      operandComponent = comparatorDefinition.operand(fieldDef, operand, this.onOperandChange);
    }

    return (
      <ReactUI.Block>
        <ReactUI.Block>
          <ReactUI.Block
            style={{width: '50%', display: 'inline-block'}}>
            <Select
              value={field}
              options={fields}
              onChange={this.onFieldChange}
              />
          </ReactUI.Block>
          {field &&
            <ReactUI.Block
              style={{width: '50%', display: 'inline-block'}}>
              <Select
                clearable={false}
                value={comparator}
                options={comparators}
                onChange={this.onComparatorChange}
                />
            </ReactUI.Block>
          }
        </ReactUI.Block>
        {operandComponent}
      </ReactUI.Block>
    );
  }

  onFieldChange = (newField: string) => {
    let {field, comparator, operand} = this.state;

    let prevField = field;
    field = newField;

    let newFieldDef = newField ? this.getFieldDefinition(newField) : null;

    if (newField) {
      let newComp = null;
      comp.getApplicableForField(newFieldDef).forEach((comp) => {
        if (comp.value === comparator) {
          return comp;
        }
      });

      let prevFieldDef = prevField ? this.getFieldDefinition(prevField) : null;

      if (!newComp) {
        comparator = null;
        operand = null;
      } else if (prevFieldDef && newFieldDef && (prevFieldDef.context.type !== newFieldDef.context.type)) {
        operand = null;
      }
    } else {
      comparator = null;
      operand = null;
    }

    if (field && !comparator) {
      let comparators = comp.getApplicableForField(newFieldDef)
      if (comparators.length > 0) {
        comparator = comparators[0].value;
      }
    }

    this.setState({field, comparator, operand}, () => { this.updateQuery(); });
  };

  onComparatorChange = (newComparator: string) => {
    this.setState(
      {
        comparator: newComparator,
        operand: null,
      },
      () => { this.updateQuery(); }
    );
  };

  onOperandChange = (newOperand: ?any) => {
    this.setState(
      {
        operand: newOperand,
      },
      () => { this.updateQuery(); }
    );
  };

  updateQuery = debounce(() => {
    let {field, comparator, operand} = this.state;

    let fieldDef = this.getFieldDefinition(field);
    let comparatorDefinition = comp.getDefinition(comparator);

    let query = comparatorDefinition.query(fieldDef, operand);

    if (query) {
      this.props.onUpdate(query);
    }
  }, 750);
}


type FilterQueryPanelProps = {
  pointer: QueryPointer<FilterQuery>;
  onClose: () => *;
};

export default class FilterQueryPanel extends React.Component<*, FilterQueryPanelProps, *> {
  context: {actions: Actions};
  state: {expressions: Array<QueryOrLiteral>};

  static contextTypes = {actions: React.PropTypes.object};

  constructor(props: FilterQueryPanelProps) {
    super(props);
    let {predicate} = props.pointer.query;
    this.state = {
      expressions: ((predicate.name === 'or') && (predicate.expressions.length > 0)) ? predicate.expressions : [true],
    };
  }

  componentWillReceiveProps(nextProps: FilterQueryPanelProps) {
    let {predicate} = nextProps.pointer.query;
    this.setState({
      expressions: (predicate && predicate.expressions) ? predicate.expressions : [true],
    });
  }

  render() {
    let {onClose, pointer} = this.props;
    let {expressions} = this.state;

    let fields = nav.getNavigationAfter(pointer.query.context).filter((field) => {
      let atom = t.maybeAtom(field.context.type);
      return (atom && (atom.name !== 'entity'));
    });

    let conditions = expressions.map((exp, idx) => {
      return (
        <ReactUI.Block
          key={idx}>
          {idx != 0 &&
            <ReactUI.Block
              paddingV={10}
              style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '0.7em',
              }}>
              <ReactUI.Text>- OR -</ReactUI.Text>
            </ReactUI.Block>
          }
          <ReactUI.Block
            style={{
              width: '95%',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}>
            <FilterCondition
              fields={fields}
              expression={exp}
              onUpdate={this.onConditionUpdate.bind(this, idx)}
              />
          </ReactUI.Block>
          <ReactUI.Block
            style={{
              width: '5%',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}>
            <ReactUI.QuietButton
              size="x-small"
              icon={<CloseIcon />}
              onClick={this.onConditionRemove.bind(this, idx)}
              />
          </ReactUI.Block>
        </ReactUI.Block>
      );
    });

    return (
      <QueryPanelBase
        title="Filter"
        onClose={onClose}
        theme={theme.filter}
        pointer={pointer}>
        <ReactUI.VBox padding={5}>
          {conditions}
          <MenuGroup paddingV={20}>
            <MenuButton icon="＋" onClick={this.onAddCondition}>
              Add Another Condition
            </MenuButton>
          </MenuGroup>
        </ReactUI.VBox>
      </QueryPanelBase>
    );
  }

  onAddCondition = () => {
    let expressions = this.state.expressions.slice();
    expressions.push(true);
    this.setState({expressions});
  };

  onConditionUpdate(index: number, condition: QueryOrLiteral) {
    let expressions = this.state.expressions.slice();
    expressions[index] = condition;
    this.setState({expressions}, () => { this.updateQuery(); });
  }

  onConditionRemove(index: number) {
    let expressions = this.state.expressions.slice();
    expressions.splice(index, 1);
    this.setState({expressions}, () => { this.updateQuery(); });
  }

  updateQuery() {
    let {expressions} = this.state;
    expressions = expressions.filter((exp) => {
      return (exp !== true);
    });

    let query;
    if (expressions.length > 0) {
      query = q.filter(q.or.apply(null, expressions.map((exp) => {
        if (q.isQuery(exp)) {
          // $ExpectError
          return q.inferTypeStep(this.props.pointer.query.context, exp);
        } else {
          return exp;
        }
      })));
    } else {
      query = q.filter(q.or(true));
    }

    this.context.actions.replace({
      pointer: this.props.pointer,
      query
    });
  }
}

