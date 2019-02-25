/**
 * @copyright 2016, Prometheus Research, LLC
 */

import React from 'react';
import {stub, createRenderer, assert} from '../../../testutils';

import {FileUploadField, FileUploadInput} from '../FileUploadField';
import {createValue} from 'react-forms';
import FileDownload from '../FileDownload';
import StoredFile from '../StoredFile';
import File from '../File';
import Field from '../Field';
import ReadOnlyField from '../ReadOnlyField';
import {delay} from '../../../lang';

describe('rex-widget/form', function() {

  describe('<FileUploadField />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders input mode', function() {
      let formValue = createValue({
        value: {
          id: 'id',
        }
      });
      renderer.render(<FileUploadField formValue={formValue.select('file')} />);
      renderer.assertElement(<Field />);
      renderer.assertElement(<FileUploadInput ownerRecordID="id" />);
    });

    it('renders in read only mode', function() {
      let formValue = createValue({
        value: {
          id: 'id',
          file: 'file'
        }
      });
      renderer.render(<FileUploadField readOnly formValue={formValue.select('file')} />);
      renderer.assertElement(<ReadOnlyField />);
      renderer.assertElement(<FileDownload ownerRecordID="id" file="file" />);
    });

  });

  describe('<FileUploadInput />', function() {

    let renderer;

    beforeEach(function() {
      renderer = createRenderer();
    });

    it('renders with no file', function() {
      renderer.render(<FileUploadInput />);
      renderer.assertNoElement(<StoredFile />);
      renderer.assertNoElement(<File />);
    });

    it('renders with stored file', function() {
      renderer.render(<FileUploadInput value={{name: 'somefile'}} />);
      renderer.assertElement(<StoredFile />);
      renderer.assertNoElement(<File />);
    });

    it('renders with choosen file', async function() {
      let uploadFile = stub().returns(
        Promise.resolve({target: {responseText: JSON.stringify({file: 'ok'})}}));

      renderer.render(<FileUploadInput uploadFile={uploadFile} />);

      let input = renderer.findWithElement(<input />);
      assert(input.props.onChange);
      let event = {
        target: {
          files: ['file']
        }
      };
      input.props.onChange(event);

      await delay();

      renderer.assertNoElement(<StoredFile />);
      renderer.assertElement(<File />);
    });

  });

});
