/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {post} from '../fetch';

export class Mutation {

  static post = post;

  constructor(path, params) {
    this.path = path;
    this._params = params;
  }

  prepareFormData() {
    return new FormData();
  }

  execute(data, prevData = null) {
    let formData = this.prepareFormData();
    formData.append('old', JSON.stringify([prevData]));
    formData.append('new', JSON.stringify([data]));
    return this.constructor.post(this.path, this._params, formData);
  }

  params(params) {
    return new this.constructor(this.path, {...this._params, ...params});
  }
}

export default function mutation(path, params = {}) {
  return new Mutation(path, params);
}
