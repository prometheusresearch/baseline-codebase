/*
 * Copyright (c) 2016, Prometheus Research, LLC
 */


import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
export let expect = chai.expect;


export function enableFetchMocking(paths = {}) {
  global._originalFetch = global.fetch;

  global.fetch = function (url) {
    let response;
    if (paths[url]) {
      let {body, ...options} = paths[url];
      response = new Response(body, options);
    } else {
      response = new Response('Unknown Path', {status: 404});
    }
    return Promise.resolve(response);
  };
}


export function disableFetchMocking() {
  global.fetch = global._originalFetch;
}

