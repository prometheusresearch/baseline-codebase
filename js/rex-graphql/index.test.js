// @flow

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import { Query, configure } from "./index";

let globalFetch = window.fetch;

afterEach(() => {
  window.fetch = globalFetch;
});

function createResponse(status, data) {
  var blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  return new Response(blob, { status });
}

function createLatch(): {| resolve: () => void, promise: Promise<void> |} {
  let resolve;
  let promise = new Promise(_resolve => {
    resolve = _resolve;
  });
  return ({ resolve, promise }: any);
}

let endpoint = configure("/graphql");
let query = "query { user { name } }";

let renderLoading = () => <div>LOADING</div>;
let renderData = ({ data }) => <div>{data.message}</div>;
let renderError = () => <div>ERROR</div>;

test("happy path", async () => {
  let latch = createLatch();
  let resp = new Promise(resolve => {
    resolve(createResponse(200, { data: { message: "Hello" } }));
  });
  window.fetch = jest.fn().mockReturnValue(resp);

  let renderLoading = () => <div>LOADING</div>;
  let renderData = ({ data }) => <div>{data.message}</div>;

  let rendered = ReactTesting.render(
    <Query
      endpoint={endpoint}
      query={query}
      renderLoading={renderLoading}
      renderData={renderData}
      renderError={renderError}
      onData={() => latch.resolve()}
    />,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    LOADING
  </div>
</DocumentFragment>
`);

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    Hello
  </div>
</DocumentFragment>
`);
});

test("GraphQL error handling", async () => {
  let latch = createLatch();
  let resp = new Promise(resolve => {
    resolve(createResponse(200, { errors: [{ message: "oops" }] }));
  });
  window.fetch = jest.fn().mockReturnValue(resp);

  let rendered = ReactTesting.render(
    <Query
      endpoint={endpoint}
      query={query}
      renderLoading={renderLoading}
      renderData={renderData}
      renderError={renderError}
      onError={() => latch.resolve()}
    />,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    LOADING
  </div>
</DocumentFragment>
`);

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    ERROR
  </div>
</DocumentFragment>
`);
});

test("network error handling", async () => {
  let latch = createLatch();
  let resp = new Promise(resolve => {
    resolve(createResponse(400, { data: { message: "ok" } }));
  });
  window.fetch = jest.fn().mockReturnValue(resp);

  let rendered = ReactTesting.render(
    <Query
      endpoint={endpoint}
      query={query}
      renderLoading={renderLoading}
      renderData={renderData}
      renderError={renderError}
      onError={() => latch.resolve()}
    />,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    LOADING
  </div>
</DocumentFragment>
`);

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    ERROR
  </div>
</DocumentFragment>
`);
});
