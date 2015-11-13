/**
 * @copyright 2015, Prometheus Research, LLC
 */

import {post} from '../fetch';

export class Mutation {

  static post = post;

  constructor(path) {
    this.path = path;
  }

  execute(data, prevData = null) {
    let formData = new FormData();
    formData.append('old', JSON.stringify([prevData]));
    formData.append('new', JSON.stringify([data]));
    return this.constructor.post(this.path, null, formData);
  }
}

export default function mutation(path) {
  return new Mutation(path);
}
