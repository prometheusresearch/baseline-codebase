/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

import Renderer from 'react-test-renderer';
import React from 'react';
import Block from '../Block';
import {I18N} from '../I18N';

describe('i18n props', function() {
  let tree;

  it('processes positionStart/positionEnd', function() {
    tree = Renderer.create(<Block positionStart={10} positionEnd={11} />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block positionStart={10} positionEnd={11} />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes paddingStart/paddingEnd', function() {
    tree = Renderer.create(<Block paddingStart={10} paddingEnd={11} />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block paddingStart={10} paddingEnd={11} />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes marginStart/marginEnd', function() {
    tree = Renderer.create(<Block marginStart={10} marginEnd={11} />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block marginStart={10} marginEnd={11} />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes textAlign="start"', function() {
    tree = Renderer.create(<Block textAlign="start" />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block textAlign="start" />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes textAlign="end"', function() {
    tree = Renderer.create(<Block testAlign="end" />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block textAlign="end" />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes float="start"', function() {
    tree = Renderer.create(<Block float="start" />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block float="start" />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });

  it('processes float="end"', function() {
    tree = Renderer.create(<Block float="end" />);
    expect(tree).toMatchSnapshot();

    tree = Renderer.create(
      <I18N dir="rtl">
        <Block float="end" />
      </I18N>,
    );
    expect(tree).toMatchSnapshot();
  });
});
