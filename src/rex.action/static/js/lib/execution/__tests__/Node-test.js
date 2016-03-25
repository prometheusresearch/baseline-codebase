/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert, stub, spy} from 'rex-widget/testutils';

import Node from '../Node';
import * as Instruction from '../Instruction';
import * as Command from '../Command';

describe('rex-action/execution', function() {

  describe('Node', function() {

    it('can be created', function() {
      let instruction = new Instruction.Execute();
      let node = Node.create(instruction, {a: 1});
      assert.deepEqual(node.context, {a: 1});
      assert(node.instruction === instruction);
    });

    it('can update the context', function() {
      let instruction = new Instruction.Execute();
      let node = Node.create(instruction, {a: 1});
      assert.deepEqual(node.context, {a: 1});
      assert(node.instruction === instruction);
      node = node.setContext({b: 2});
      assert.deepEqual(node.context, {a: 1, b: 2});
      assert(node.instruction === instruction);
    });

    it('can replace the context', function() {
      let instruction = new Instruction.Execute();
      let node = Node.create(instruction, {a: 1});
      assert.deepEqual(node.context, {a: 1});
      assert(node.instruction === instruction);
      node = node.replaceContext({b: 2});
      assert.deepEqual(node.context, {b: 2});
      assert(node.instruction === instruction);
    });

    it('can replace the state', function() {
      let instruction = new Instruction.Execute();
      let node = Node.create(instruction);
      assert.deepEqual(node.state, {});
      node = node.replaceState({b: 2});
      assert.deepEqual(node.state, {b: 2});
    });

    it('can update the state', function() {
      let instruction = new Instruction.Execute();
      let node = Node.create(instruction);
      assert.deepEqual(node.state, {});
      node = node.setState({a: 1});
      node = node.setState({b: 2});
      assert.deepEqual(node.state, {a: 1, b: 2});
    });

    it('can be queries for match', function() {
      let input = {
        match: stub().returns(true)
      };
      let instruction = new Instruction.Execute(
        'id', [], {props: {contextTypes: {input}}});
      let node = Node.create(instruction);
      assert(node.isAllowed);
      assert(input.match.calledOnce);
    });

    it('can execute command', function() {

      let command = {
        execute() { return {a: 1}; }
      };
      spy(command, 'execute');
      stub(Command, 'getCommand').returns(command);

      let instruction = new Instruction.Execute('action', [], {props: {p: 2}});
      let node = Node.create(instruction);
      let nextNode = node.executeCommand('commandName', 1, 2);

      assert(Command.getCommand.calledOnce);

      assert(command.execute.calledOnce);
      assert.deepEqual(
        command.execute.firstCall.args,
        [instruction.element.props, node.context, 1, 2]
      );

      assert.deepEqual(nextNode.command, {commandName: 'commandName', args: [1, 2]});
      assert.deepEqual(nextNode.context, {a: 1});

      Command.getCommand.restore();
    });

    it('can re-execute command', function() {
      let command = {
        execute(props, context, a) { return {a}; }
      };
      spy(command, 'execute');
      stub(Command, 'getCommand').returns(command);

      let instruction = new Instruction.Execute('action', [], {props: {p: 2}});
      let node = Node.create(instruction);
      node = node.executeCommand('commandName', 1);
      assert.deepEqual(node.context, {a: 1});
      node = node.reExecuteCommand(42);
      assert.deepEqual(node.context, {a: 42});

      Command.getCommand.restore();
    });

    describe('.then', function() {

      it('can provide a list of further nodes', function() {
        let thenInstructions = [
          new Instruction.Execute('action1', []),
          new Instruction.Execute('action2', []),
        ];
        let instruction = new Instruction.Execute('root', thenInstructions);
        let node = Node.create(instruction);
        let then = node.then;
        assert(then.length === 2);
        assert(then[0].instruction === thenInstructions[0]);
        assert(then[1].instruction === thenInstructions[1]);
        assert(then[1].start === node);
        assert(then[1].keyPath === 'action2');
      });

      it('enter wizard', function() {
        let thenInstructions = [
          new Instruction.IncludeWizard('', [], {
            props: {
              path: new Instruction.Start([
                new Instruction.Execute('x', thenInstructions)
              ])
            }
          })
        ];
        let instruction = new Instruction.Execute('root', thenInstructions);
        let node = Node.create(instruction);
        let then = node.then;
        assert(then.length === 1);
        assert(then[0].instruction === thenInstructions[0].element.props.path.then[0]);
      });

      it('returns from wizard', function() {
        let exit = new Instruction.Execute('exit', []);
        let thenInstructions = [
          new Instruction.IncludeWizard('', [exit], {
            props: {
              path: new Instruction.Start([
                new Instruction.Execute('enter', [])
              ])
            }
          })
        ];
        let instruction = new Instruction.Execute('root', thenInstructions);
        let node = Node.create(instruction);
        let then = node.then[0].then;
        assert(then.length === 1);
        assert(then[0].instruction.action === 'exit');
      });

      it('follows replace', function() {
        let instruction = new Instruction.Execute('root', [
          new Instruction.Execute('target', [], {props: {contextTypes: {rows: {}}}}),
          new Instruction.Replace('./target'),
        ]);
        let node = Node.create(instruction);
        let then = node.then;
        assert(then.length === 2);
        assert(then[0]._concreteNode.instruction.action === 'target');
        assert(then[1]._concreteNode.instruction.action === 'target');
      });

    });

  });

});

