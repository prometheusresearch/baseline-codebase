/**
 * @copyright 2016, Prometheus Research, LLC
 */

import assert from 'power-assert';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {createValue} from 'react-forms';

import ConfigurableField from '../ConfigurableField';
import Fieldset from '../Fieldset';
import ReadOnlyField from '../ReadOnlyField';
import Field from '../Field';
import IntegerField from '../IntegerField';
import NumberField from '../NumberField';
import DateField from '../DateField';
import CheckboxField from '../CheckboxField';
import SelectField from '../SelectField';
import RepeatingFieldset from '../RepeatingFieldset';
import FileUploadField from '../FileUploadField';

describe('<ConfigurableField />', function() {

  it('renders into null if hidden', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    let field = {
      hideIf() {
        return true;
      }
    };
    renderer.render(
      <ConfigurableField formValue={formValue} field={field} />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children === null);
  });

  it('delegates to field widget if any', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    let field = {
      widget: <widget />
    };
    renderer.render(
      <ConfigurableField formValue={formValue} field={field} />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children);
    assert(root.props.children.type === 'widget');
    assert(root.props.children.props.formValue === formValue);
    assert(!root.props.children.props.readOnly);
  });

  it('delegates to field widget if any (read only)', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    let field = {
      widget: <widget />
    };
    renderer.render(
      <ConfigurableField formValue={formValue} field={field} readOnly />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children);
    assert(root.props.children.type === 'widget');
    assert(root.props.children.props.formValue === formValue);
    assert(root.props.children.props.readOnly);
  });

  it('delegates to an edit field widget if any', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    let field = {
      widget: {
        edit: <widget />
      }
    };
    renderer.render(
      <ConfigurableField formValue={formValue} field={field} />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children);
    assert(root.props.children.type === 'widget');
    assert(root.props.children.props.formValue === formValue);
  });

  it('delegates to a show field widget if any (read only)', function() {
    let renderer = TestUtils.createRenderer();
    let formValue = createValue({schema: null, value: false});
    let field = {
      widget: {
        show: <widget />
      }
    };
    renderer.render(
      <ConfigurableField formValue={formValue} field={field} readOnly />
    );
    let root = renderer.getRenderOutput();
    assert(root.props.children);
    assert(root.props.children.type === 'widget');
    assert(root.props.children.props.formValue === formValue);
  });

  function itRendersFieldForType(Field, field) {
    if (typeof field === 'string') {
      field = {type: field};
    }
    it(`renders "${field.type}" field`, function() {
      let renderer = TestUtils.createRenderer();
      let formValue = createValue({schema: null, value: false});
      renderer.render(
        <ConfigurableField formValue={formValue} field={field} />
      );
      let root = renderer.getRenderOutput();
      assert(root.props.children.type === Field);
      assert(root.props.children.props.formValue === formValue);
    });
  }

  itRendersFieldForType(DateField, 'date');
  itRendersFieldForType(FileUploadField, 'file');
  itRendersFieldForType(CheckboxField, 'bool');
  itRendersFieldForType(SelectField, 'enum');
  itRendersFieldForType(IntegerField, 'integer');
  itRendersFieldForType(NumberField, 'number');
  itRendersFieldForType(ReadOnlyField, 'calculation');
  itRendersFieldForType(RepeatingFieldset, {type: 'list', fields: []});
  itRendersFieldForType(Fieldset, {type: 'fieldset', fields: []});
  itRendersFieldForType(Field, 'unknown');

});

