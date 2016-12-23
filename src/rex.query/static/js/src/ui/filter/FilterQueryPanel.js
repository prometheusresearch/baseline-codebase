/**
 * @flow
 */

import type {Expression, FilterQuery} from '../../model/Query';
import type {QueryPointer} from '../../model/QueryPointer';
import type {Actions} from '../../state';

import React from 'react';
import {Element} from 'react-stylesheet';
import * as ReactUI from '@prometheusresearch/react-ui';

import * as Icon from '../../ui/Icon';
import * as q from '../../model/Query';
import * as nav from '../../model/navigation';
import * as theme from '../Theme';
import QueryPanelBase from '../QueryPanelBase';
import {MenuGroup, MenuButton} from '../menu';
import FilterCondition from './FilterCondition';

type FilterQueryPanelProps = {
  pointer: QueryPointer<FilterQuery>;
  onClose: () => *;
};

function ORSeparator() {
  return (
    <Element
      position="relative"
      padding={{vertical: 10}}
      textAlign="center"
      fontWeight={300}
      color="#888"
      fontSize="0.7em">
      <hr />
      <Element
        position="absolute"
        top={5}
        left="50%"
        width={25}
        marginLeft={-12.5}
        padding={5}
        background="#fff">
        OR
      </Element>
    </Element>
  );
}

export default class FilterQueryPanel extends React.Component<*, FilterQueryPanelProps, *> {

  context: {
    actions: Actions;
  };

  state: {
    expressions: Array<Expression>;
  };

  static contextTypes = {actions: React.PropTypes.object};

  constructor(props: FilterQueryPanelProps) {
    super(props);
    let {predicate} = props.pointer.query;
    let isValidPredicate = (
      predicate.name === 'logicalBinary' &&
      predicate.op === 'or' &&
      predicate.expressions.length > 0
    );
    this.state = {
      expressions: isValidPredicate
        ? predicate.expressions
        : [q.value(true)],
    };
  }

  componentWillReceiveProps(nextProps: FilterQueryPanelProps) {
    let {predicate} = nextProps.pointer.query;
    this.setState({
      expressions: predicate && predicate.expressions
        ? predicate.expressions
        : [q.value(true)],
    });
  }

  render() {
    let {onClose, pointer} = this.props;
    let {expressions} = this.state;

    let fields = nav.getNavigationAfter(pointer.query.context).filter(field => {
      let type = field.context.type;
      return type.name !== 'invalid';
    });

    let conditions = expressions.map((exp, idx) => {
      return (
        <Element
          key={idx}>
          {idx !== 0 &&
            <ORSeparator />}
          <Element
            padding={{horizontal: 5, vertical: 10}}>
            <Element
              textAlign="right"
              marginBottom={5}>
              <ReactUI.QuietButton
                size="x-small"
                icon={<Icon.IconRemove />}
                onClick={this.onConditionRemove.bind(this, idx)}
                />
            </Element>
            <Element verticalAlign="middle">
              <FilterCondition
                fields={fields}
                expression={exp}
                onUpdate={this.onConditionUpdate.bind(this, idx)}
                />
            </Element>
          </Element>
        </Element>
      );
    });

    return (
      <QueryPanelBase
        title="Filter"
        onClose={onClose}
        theme={theme.filter}
        pointer={pointer}>
        <ReactUI.VBox padding={0}>
          <ReactUI.VBox padding={5}>
            {conditions}
          </ReactUI.VBox>
          <MenuGroup padding={{vertical: 20}}>
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
    expressions.push(q.value(true));
    this.setState({expressions});
  };

  onConditionUpdate(index: number, condition: Expression) {
    let expressions = this.state.expressions.slice();
    expressions[index] = condition;
    this.setState({expressions}, () => this.updateQuery());
  }

  onConditionRemove(index: number) {
    let expressions = this.state.expressions.slice();
    expressions.splice(index, 1);
    this.setState({expressions}, () => this.updateQuery());
  }

  updateQuery() {
    let {expressions} = this.state;
    expressions = expressions.filter(expression =>
      !(expression.name === 'value' && expression.value === true));

    let query;
    if (expressions.length > 0) {
      query = q.filter(q.or(...expressions.map(expression =>
        q.inferExpressionType(this.props.pointer.query.context, expression))));
    } else {
      query = q.filter(q.or(q.value(true)));
    }

    this.context.actions.replace({
      pointer: this.props.pointer,
      query
    });
  }
}

