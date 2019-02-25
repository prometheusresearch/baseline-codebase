import Sinon from 'sinon';
import assert from 'power-assert';
import TabListBase from '../TabListBase';
import Tab from '../TabBase';
import React from 'react';
import TestUtils from 'react-addons-test-utils';

describe('<TabListBase />', function() {

  it('renders', function() {
    let renderer = TestUtils.createRenderer();
    let onSelected = Sinon.spy();
    renderer.render(
      <TabListBase selected="ok" onSelected={onSelected}>
        <Tab id="ok" title="OK">Content</Tab>
        <Tab id="nope">Nope</Tab>
      </TabListBase>
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
      <TabListBase selected="nope" onSelected={onSelected}>
        <Tab id="ok" title="OK">Content</Tab>
        <Tab id="nope">Nope</Tab>
      </TabListBase>
    );
    root = renderer.getRenderOutput();
    let {props: {children: nextContent}} = root.props.children[1];
    assert(nextContent.type === Tab);
    assert(nextContent.props.id === 'nope');
  });
});
