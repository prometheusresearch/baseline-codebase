/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert, stub, spy} from 'rex-widget/testutils';

import Graph from '../Graph';
import Node from '../Node';
import * as Instruction from '../Instruction';
import * as Entity from '../../Entity';

describe('rex-action/execution', function() {

  describe('Graph', function() {

    afterEach(function() {
      Node.create.restore();
    });

    it('initialises', function() {
      let nextNode = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert(graph.trace.length === 2);
      assert(graph.node === nextNode);
      assert(graph.indexOf('next') === 1);
    });

    it('.close()', function() {
      let nextNode = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert(graph.trace.length === 2);
      graph = graph.close();
      assert(graph.trace.length === 1);
      assert(graph.node === node);
    });

    it('.returnTo()', function() {
      let nextNode = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert(graph.trace.length === 2);
      graph = graph.returnTo('next');
      assert(graph.trace.length === 2);
      assert(graph.node === nextNode);
      graph = graph.returnTo('root');
      assert(graph.trace.length === 1);
      assert(graph.node === node);
    });

    it('.replace() (advance true)', function() {
      let nextNode1 = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
        then: [],
      };
      let nextNode2NextNode = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next2.next',
      };
      let nextNode2 = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
        then: [
          nextNode2NextNode
        ],
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert(graph.trace.length === 2);
      assert(graph.node === nextNode1);
      graph = graph.replace('next1', 'next2');
      assert(graph.trace.length === 3);
      assert(graph.node === nextNode2NextNode);
    });

    it('.replace() (advance false)', function() {
      let nextNode1 = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
        then: [],
      };
      let nextNode2NextNode = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next2.next',
      };
      let nextNode2 = {
        isAllowed: true,
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
        then: [
          nextNode2NextNode
        ],
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert(graph.trace.length === 2);
      assert(graph.node === nextNode1);
      graph = graph.replace('next1', 'next2', false);
      assert(graph.trace.length === 2);
      assert(graph.node === nextNode2);
    });

    it('.updateEntity()', function() {
      let context = {a: Entity.createEntity('study', 1)};
      let nextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next',
        context: context,
        replaceContext(context) {
          return {...nextNode, context};
        }
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        context: context,
        command: {
          commandName: 'context',
          args: [{study: Entity.createEntity('study', 1)}]
        },
        reExecuteCommand() {
          return node;
        },
        replaceContext(context) {
          return {...node, context};
        }
      };
      stub(Node, 'create').returns(node);
      spy(node, 'reExecuteCommand');
      spy(node, 'replaceContext');
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction);
      assert.deepEqual(graph.node.context, context);
      graph = graph.updateEntity(
        Entity.createEntity('study', 1),
        Entity.createEntity('study', 2)
      );
      assert(node.reExecuteCommand.calledOnce);
      assert(node.replaceContext.calledOnce);
    });

    it('.executeCommandAtCurrentNode()', function() {
      let actions = {};
      let nextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        executeCommand(commandName, context) {
          return {...nextNode, context};
        }
      };
      stub(Node, 'create').returns(node);
      spy(node, 'executeCommand');
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction, actions, {}, undefined, false);
      assert(graph.node.keyPath === 'root');
      assert.deepEqual(graph.node.context, undefined);
      graph = graph.executeCommandAtCurrentNode('context', {a: 42});
      assert(node.executeCommand.calledOnce);
      assert(graph.node.keyPath === 'next');
      assert.deepEqual(graph.node.context, {a: 42});
    });

    it('.executeCommandAtCurrentNodeAndNoAdvance()', function() {
      let actions = {};
      let nextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        executeCommand(commandName, context) {
          return {...node, context};
        }
      };
      stub(Node, 'create').returns(node);
      spy(node, 'executeCommand');
      let instruction = new Instruction.Start([
        new Instruction.Execute('action')
      ]);
      let graph = Graph.create(instruction, actions, {}, undefined, false);
      assert(graph.node.keyPath === 'root');
      assert(graph.trace.length === 1);
      assert.deepEqual(graph.node.context, undefined);
      graph = graph.executeCommandAtCurrentNodeAndNoAdvance('context', {a: 42});
      assert(graph.trace.length === 1);
      assert(graph.node.keyPath === 'root');
      assert(node.executeCommand.calledOnce);
      assert.deepEqual(graph.node.context, {a: 42});
    });

    it('.advance()', function() {
      let actions = {};
      let nextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next')
      ]);
      let graph = Graph.create(instruction, actions, {}, undefined, false);
      assert(graph.node.keyPath === 'root');
      assert(graph.trace.length === 1);
      assert.deepEqual(graph.node.context, undefined);
      graph = graph.advance();
      assert(graph.node.keyPath === 'next');
      assert(graph.trace.length === 2);
      assert.deepEqual(graph.node.context, undefined);
    });

    it('.advance() to reference', function() {
      let replaceNode ={
        isAllowed: true,
        then: [],
        instruction: new Instruction.Replace('../next2'),
        keyPath: 'next1',
      };
      let nextNode1 = {
        isAllowed: true,
        then: [replaceNode],
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
        action: 'next1',
      };
      let nextNode2 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
        action: 'next2',
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        action: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next1', [
          new Instruction.Replace('../next2'),
        ]),
        new Instruction.Execute('next2'),
      ]);
      let graph = Graph.create(instruction, {});
      assert(graph.node.keyPath === 'next1');
      graph = graph.advance();
      assert(graph.node.keyPath === 'next2');
    });

    it('.advance(next)', function() {
      let actions = {};
      let nextNode1 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
      };
      let nextNode2 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next1'),
        new Instruction.Execute('next2')
      ]);
      let graph = Graph.create(instruction, actions, {}, undefined, false);
      assert(graph.node.keyPath === 'root');
      assert(graph.trace.length === 1);
      assert.deepEqual(graph.node.context, undefined);
      graph = graph.advance('next2');
      assert(graph.node.keyPath === 'next2');
      assert(graph.trace.length === 2);
      assert.deepEqual(graph.node.context, undefined);
    });

    it('.advance(next, contextUpdate)', function() {
      let actions = {};
      let nextNode1 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
      };
      let nextNode2 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        setContext(context) {
          return {...node, context};
        }
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next1'),
        new Instruction.Execute('next2')
      ]);
      let graph = Graph.create(instruction, actions, {}, undefined, false);
      assert(graph.node.keyPath === 'root');
      assert(graph.trace.length === 1);
      assert.deepEqual(graph.node.context, undefined);
      graph = graph.advance('next2', {a: 42});
      assert(graph.node.keyPath === 'next2');
      assert(graph.trace.length === 2);
      assert.deepEqual(graph.trace[0].context, {a: 42});
    });

    it('.setState()', function() {
      let nextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next',
        setState(state) {
          return {...nextNode, state};
        }
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
      };
      stub(Node, 'create').returns(node);
      spy(nextNode, 'setState');
      let instruction = new Instruction.Start([
        new Instruction.Execute('next'),
      ]);
      let graph = Graph.create(instruction, {});
      graph = graph.setState(nextNode, {a: 42});
      assert(nextNode.setState.calledOnce);
      assert.deepEqual(graph.node.state, {a: 42});
    });

    it('.siblingActions()', function() {
      let nextNode1 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
      };
      let nextNode2 = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
      };
      let node = {
        isAllowed: true,
        then: [nextNode1, nextNode2],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        replaceContext(context) {
          return {...node, context};
        }
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next1'),
        new Instruction.Execute('next2'),
      ]);
      let graph = Graph.create(instruction, {});
      let siblingActions = graph.siblingActions();
      assert(siblingActions.length === 2);
      assert(siblingActions[0] === nextNode1);
      assert(siblingActions[1] === nextNode2);
    });

    it('.nextActions()', function() {
      let nextNextNode = {
        isAllowed: true,
        then: [],
        instruction: new Instruction.Execute(),
        keyPath: 'next2',
      };
      let nextNode = {
        isAllowed: true,
        then: [nextNextNode],
        instruction: new Instruction.Execute(),
        keyPath: 'next1',
      };
      let node = {
        isAllowed: true,
        then: [nextNode],
        instruction: new Instruction.Start(),
        keyPath: 'root',
        replaceContext(context) {
          return {...node, context};
        }
      };
      stub(Node, 'create').returns(node);
      let instruction = new Instruction.Start([
        new Instruction.Execute('next', [
          new Instruction.Execute('nextnext'),
        ]),
      ]);
      let graph = Graph.create(instruction, {});
      let nextActions = graph.nextActions();
      assert(nextActions.length === 1);
      assert(nextActions[0] === nextNextNode);
    });

  });

});
