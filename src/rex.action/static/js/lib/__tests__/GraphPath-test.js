/**
 * @copyright 2016, Prometheus Research, LLC
 */

import {assert, spy, stub} from 'rex-widget/testutils';
import {Graph, Command} from '../execution';
import {fromPath, toPath} from '../GraphPath';

describe('rex-widget', function() {

  describe('GraphPath', function() {

    describe('toPath', function() {

      beforeEach(function() {
        let arg = {
          stringify(element, arg) { return arg; }
        };
        spy(arg, 'stringify');
        stub(Command, 'getCommand').returns({
          argumentTypes: [arg, arg, arg]
        });
      });

      afterEach(function() {
        Command.getCommand.restore();
      });

      it('processes an empty graph', function() {
        let graph = {
          trace: [undefined]
        };
        let path = toPath(graph);
        assert(path === '/');
      });

      it('processes a graph with one action', function() {
        let graph = {
          trace: [
            undefined,
            {action: 'action'}
          ]
        };
        let path = toPath(graph);
        assert(path === '/action');
      });

      it('processes a graph with two actions', function() {
        let graph = {
          trace: [
            undefined,
            {action: 'action'},
            {action: 'next-action'},
          ]
        };
        let path = toPath(graph);
        assert(path === '/action/next-action');
      });

      it('processes a graph with an action with a command', function() {
        let graph = {
          trace: [
            undefined,
            {action: 'action', command: {commandName: 'command', args: ['a', 'b']}},
          ]
        };
        let path = toPath(graph);
        assert(path === '/action.command[a,b]');
      });

      it('processes a graph with an action with a default command', function() {
        let graph = {
          trace: [
            undefined,
            {action: 'action', command: {commandName: 'default', args: ['a', 'b']}},
          ]
        };
        let path = toPath(graph);
        assert(path === '/action[a,b]');
      });

    });

    describe('fromPath', function() {

      let graph = null;

      function setupGraph(nextGraph) {
        graph = {
          ...nextGraph,
          advance() {
            return graph;
          },
          executeCommandAtCurrentNodeAndNoAdvance() {
            return graph;
          }
        };
        spy(graph, 'advance');
        spy(graph, 'executeCommandAtCurrentNodeAndNoAdvance');
        stub(Graph, 'create').returns(graph);
      }

      beforeEach(function() {
        stub(Command, 'getCommand').returns({
          argumentTypes: [
            {parse: stub().returns(1)},
            {parse: stub().returns(2)},
            {parse: stub().returns(3)},
          ]
        });
      });

      afterEach(function() {
        graph = null;
        Graph.create.restore();
        Command.getCommand.restore();
      });

      it('parses /', function() {
        setupGraph({
          node: {
            then: []
          }
        });
        let path = '/';
        let instruction = {};
        let initialContext = {};
        let result = fromPath(path, instruction, initialContext);
        assert(result === graph);
        assert(Graph.create.calledOnce);
        assert.deepEqual(
          Graph.create.lastCall.args,
          [instruction, initialContext, false]
        );
        assert(graph.advance.calledOnce);
        assert(graph.advance.lastCall.args[0] === undefined);
      });

      it('parses /action', function() {
        setupGraph({
          node: {
            then: [
              {action: 'action', keyPath: 'action'}
            ]
          }
        });
        let path = '/action';
        let instruction = {};
        let initialContext = {};
        let result = fromPath(path, instruction, initialContext);
        assert(result === graph);
        assert(Graph.create.calledOnce);
        assert.deepEqual(
          Graph.create.lastCall.args,
          [instruction, initialContext, false]
        );
        assert(graph.advance.calledOnce);
        assert(graph.advance.lastCall.args[0] === 'action');
      });

      it('parses /action/next-action', function() {
        setupGraph({
          node: {
            then: [
              {action: 'action', keyPath: 'action'},
              {action: 'next-action', keyPath: 'next-action'}
            ]
          }
        });
        let path = '/action/next-action';
        let instruction = {};
        let initialContext = {};
        let result = fromPath(path, instruction, initialContext);
        assert(result === graph);
        assert(Graph.create.calledOnce);
        assert.deepEqual(
          Graph.create.lastCall.args,
          [instruction, initialContext, false]
        );
        assert(graph.advance.calledTwice);
        assert(graph.advance.firstCall.args[0] === 'action');
        assert(graph.advance.lastCall.args[0] === 'next-action');
      });

      it('parses /action[command]', function() {
        setupGraph({
          node: {
            then: [
              {action: 'action', keyPath: 'action', element: 'element'},
            ]
          }
        });
        let path = '/action[command]';
        let instruction = {};
        let initialContext = {};
        let result = fromPath(path, instruction, initialContext);
        assert(result === graph);
        assert(Graph.create.calledOnce);
        assert.deepEqual(
          Graph.create.lastCall.args,
          [instruction, initialContext, false]
        );
        assert(graph.advance.calledOnce);
        assert(graph.advance.firstCall.args[0] === 'action');
        assert(graph.executeCommandAtCurrentNodeAndNoAdvance.calledOnce);
      });

    });

  });

});
