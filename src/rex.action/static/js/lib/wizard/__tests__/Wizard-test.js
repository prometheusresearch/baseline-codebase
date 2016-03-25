/**
 * @copyright 2016, Prometheus Research, LLC
 */


import React from 'react';

import {
  assert,
  stub,
  spy,
  createRenderer
} from 'rex-widget/testutils';

import * as fetch from 'rex-widget/lib/fetch';

import * as GraphPath from '../../GraphPath';
import {Instruction} from '../../execution';
import Wizard from '../Wizard';
import Sidebar from '../Sidebar';
import Breadcrumb from '../Breadcrumb';

describe('rex-action/wizard', function() {

  describe('<Wizard/>', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders', function() {
      let graph = {
        node: {
          element: <div />
        },
        trace: [{}, {}, {}],
      };
      stub(GraphPath, 'fromPath', function() {
        return graph;
      });
      let path = new Instruction.Start([
        new Instruction.Execute('next', [], <div />)
      ]);
      renderer.render(
        <Wizard
          path={path}
          />
      );
      renderer.assertElementWithTypeProps(Breadcrumb);
      renderer.assertElementWithTypeProps(Sidebar);
      GraphPath.fromPath.restore();
    });

    describe('history handling', function() {

      let graph;
      let nextGraph;
      let history;
      let historyListen;
      let historyStopListen;

      beforeEach(function() {
        graph = {
          node: {
            element: <div />
          },
          trace: [{}, {}, {}],
        };
        nextGraph = {
          node: {
            element: <div />
          },
          trace: [{}, {}, {}],
        };
        stub(GraphPath, 'fromPath')
          .onCall(0).returns(graph)
          .onCall(1).returns(nextGraph);
        historyListen = spy();
        historyStopListen = spy();
        history = {
          listen(func) {
            func({pathname: '/'});
            historyListen(func);
            return historyStopListen;
          },
          replaceState: spy(),
        };
        let createHistory = function() {
          return history;
        };
        let path = new Instruction.Start([
          new Instruction.Execute('next', [], <div />)
        ]);
        renderer.render(
          <Wizard
            path={path}
            createHistory={createHistory}
            />
        );
        renderer.instance.componentDidMount();
      });

      afterEach(function() {
        GraphPath.fromPath.restore();
      });

      it('reacts on location change (PUSH)', function() {
        assert(historyListen.callCount > 0);
        let onLocation = historyListen.lastCall.args[0];
        assert(typeof onLocation === 'function');
        onLocation({action: 'PUSH'});
        renderer.instance.componentWillUnmount();
        assert(historyStopListen.callCount === historyListen.callCount);
      });

      it('reacts on location change (POP)', function() {
        assert(historyListen.callCount > 0);
        let onLocation = historyListen.lastCall.args[0];
        assert(typeof onLocation === 'function');
        onLocation({action: 'POP', pathname: '/some'});
        renderer.instance.componentWillUnmount();
        assert(historyStopListen.callCount === historyListen.callCount);
      });

    });

    describe('refetch', function() {
      let graph;
      let promise;

      beforeEach(function() {
        graph = {
          node: {
            element: <span />
          },
          replaceTrace() {
            return graph;
          },
          trace: [
            {
              element: <span />,
              keyPath: 'a',
              context: {a: 1},
              setContext() {
                return graph.trace[0];
              }
            },
            {
              element: <span />,
              keyPath: 'b',
              context: {b: 2},
              setContext() {
                return graph.trace[1];
              }
            }
          ],
        };
        stub(GraphPath, 'fromPath').returns(graph);
        let path = new Instruction.Start([
          new Instruction.Execute('next', [], <div />)
        ]);
        renderer.render(
          <Wizard
            data="/data"
            path={path}
            />
        );
        promise = {
          then: spy()
        };
        stub(fetch, 'post').returns(promise);
      });

      afterEach(function() {
        GraphPath.fromPath.restore();
        fetch.post.restore();
      });

      it('fires a refetch', function() {
        let action = renderer.findWithTypeProps('span');
        let refetch = action.props.refetch;
        assert(typeof refetch === 'function');
        refetch();
        assert(fetch.post.calledOnce);
        assert.deepEqual(fetch.post.lastCall.args, [
          '/data',
          null,
          '{"a":{"a":1},"b":{"b":2}}'
        ]);
        assert(promise.then.calledOnce);
        let [onRefetchComplete] = promise.then.lastCall.args;
        onRefetchComplete({});
      });

    });

    describe('props passed to action', function() {
      let graph;

      beforeEach(function() {
        graph = {
          advance: stub().returnsThis(),
          returnTo: stub().returnsThis(),
          replace: stub().returnsThis(),
          executeCommandAtCurrentNode: stub().returnsThis(),
          executeCommandAtCurrentNodeAndNoAdvance: stub().returnsThis(),
          setState: stub().returnsThis(),
          updateEntity: stub().returnsThis(),
          node: {
            keyPath: 'x',
            element: <span />
          },
          replaceTrace() {
            return graph;
          },
          trace: [1, 2, 3],
        };
        stub(GraphPath, 'fromPath').returns(graph);
        let path = new Instruction.Start([
          new Instruction.Execute('next', [], <div />)
        ]);
        renderer.render(
          <Wizard
            path={path}
            />
        );
      });

      afterEach(function() {
        GraphPath.fromPath.restore();
      });

      it('processes clicks on toolbar', function() {
        let action = renderer.findWithTypeProps('span');
        assert(action.props.toolbar);
        assert(action.props.toolbar.props.onClick);
        let onClick = action.props.toolbar.props.onClick;
        onClick('next');
        assert(graph.advance.calledOnce);
        assert(graph.advance.lastCall.args[0] === 'next');
      });

      it('processes clicks on breadcrumb', function() {
        let breadcrumb = renderer.findWithTypeProps(Breadcrumb);
        assert(breadcrumb.props.onClick);
        let onClick = breadcrumb.props.onClick;
        onClick('ret');
        assert(graph.returnTo.calledOnce);
        assert(graph.returnTo.lastCall.args[0] === 'ret');
      });

      it('processes clicks on sidebar', function() {
        let sidebar = renderer.findWithTypeProps(Sidebar);
        assert(sidebar.props.onClick);
        let onClick = sidebar.props.onClick;
        onClick('rep');
        assert(graph.replace.calledOnce);
        assert(graph.replace.lastCall.args[0] === 'x');
        assert(graph.replace.lastCall.args[1] === 'rep');
      });

      it('processes commands from actions', function() {
        let action = renderer.findWithTypeProps('span');
        assert(action.props.onCommand);
        let onCommand = action.props.onCommand;
        onCommand('context', {a: 42});
        assert(graph.executeCommandAtCurrentNode.calledOnce);
        assert.deepEqual(graph.executeCommandAtCurrentNode.lastCall.args, [
          'context', {a: 42}
        ]);
      });

      it('processes context updates from actions', function() {
        let action = renderer.findWithTypeProps('span');
        assert(action.props.onContext);
        let onContext = action.props.onContext;
        onContext({a: 42});
        assert(graph.executeCommandAtCurrentNode.calledOnce);
        assert.deepEqual(graph.executeCommandAtCurrentNode.lastCall.args, [
          'context', {a: 42}
        ]);
      });

      it('processes context updates (no advance) from actions', function() {
        let action = renderer.findWithTypeProps('span');
        assert(action.props.onContextNoAdvance);
        let onContext = action.props.onContextNoAdvance;
        onContext({a: 42});
        assert(graph.executeCommandAtCurrentNodeAndNoAdvance.calledOnce);
        assert.deepEqual(graph.executeCommandAtCurrentNodeAndNoAdvance.lastCall.args, [
          'context', {a: 42}
        ]);
      });

      it('processes state updates from actions', function() {
        let action = renderer.findWithTypeProps('span');
        assert(action.props.setActionState);
        let setActionState = action.props.setActionState;
        setActionState({a: 42});
        assert(graph.setState.calledOnce);
        assert.deepEqual(graph.setState.lastCall.args, [
          graph.node, {a: 42}
        ]);
      });

      it('updateEntity', function() {
        let action = renderer.findWithTypeProps('span');
        stub(renderer.instance, '_refetch');
        assert(action.props.onEntityUpdate);
        let onEntityUpdate= action.props.onEntityUpdate;
        onEntityUpdate(1, 2);
        assert(graph.updateEntity.calledOnce);
        assert.deepEqual(graph.updateEntity.lastCall.args, [1, 2]);
        assert(renderer.instance._refetch.calledOnce);
      });

    });

  });

});
