/**
 * @copyright 2016, Prometheus Research, LLC
 */

import Sinon from 'sinon';
import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import PillList from '../PillList';
import Tab from '../base/TabBase';

describe('<PillList />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    let onSelected = Sinon.spy();
    renderer.render(
      <PillList selected="ok" onSelected={onSelected}>
        <Tab id="ok" title="OK">Content</Tab>
        <Tab id="nope">Nope</Tab>
      </PillList>
    );
    let root = renderer.getRenderOutput();
    let [buttons, {props: {children: content}}] = root.props.children;
    assert(buttons.props.children.length === 2);
    let [okButton, nopeButton] = buttons.props.children;
    assert(okButton.props.children === 'OK');
    assert(nopeButton.props.children === 'nope');
    assert(content.type === Tab);
    assert(content.props.id === 'ok');

    let ev = {
      preventDefault() {
      }
    };
    nopeButton.props.onClick(ev);
    assert(onSelected.calledOnce);
    assert(onSelected.firstCall.args.length === 1);
    assert(onSelected.firstCall.args[0] === 'nope');

    renderer.render(
      <PillList  selected="nope" onSelected={onSelected}>
        <Tab id="ok" title="OK">Content</Tab>
        <Tab id="nope">Nope</Tab>
      </PillList>
    );
    root = renderer.getRenderOutput();
    let {props: {children: nextContent}} = root.props.children[1];
    assert(nextContent.type === Tab);
    assert(nextContent.props.id === 'nope');
  });

});
