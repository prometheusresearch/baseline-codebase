// @flow

import * as React from "react";
import * as ReactTesting from "react-testing-library";
import * as Resource from "./Resource.js";
import { configure } from "./index.js";

function mockFetch(status, data) {
  window.fetch = jest.fn(
    () => new Promise(resolve => resolve(createResponse(status, data))),
  );
}

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

function Fallback() {
  return <div>FALLBACK</div>;
}

function Component({ latch, resource, params }: any) {
  let res = Resource.unstable_useResource(resource, params);
  latch.resolve();
  return <pre>{JSON.stringify(res, null, 2)}</pre>;
}

let endpoint = configure("/graphql");

test("query: happy path", async () => {
  let resource = Resource.defineQuery({
    endpoint,
    query: ``,
  });

  let rendered;
  let latch;

  mockFetch(200, { data: { message: "Hello" } });

  latch = createLatch();

  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} latch={latch} />
    </React.Suspense>,
  );

  // first we should see a fallback rendered

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  // now let's wait for data

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);

  // now let's rerender and see it's using cached data

  latch = createLatch();
  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} latch={latch} />
    </React.Suspense>,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);
});

test("query: re-fetching with a different resource", async () => {
  let resource1 = Resource.defineQuery({
    endpoint,
    query: ``,
  });

  let resource2 = Resource.defineQuery({
    endpoint,
    query: ``,
  });

  let rendered;
  let latch;

  mockFetch(200, { data: { message: "Hello" } });

  latch = createLatch();

  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource1} latch={latch} />
    </React.Suspense>,
  );

  // first we should see a fallback rendered

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  // now let's wait for data

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);

  // now let's rerender with another resource

  mockFetch(200, { data: { message: "Hello ANOTHER" } });
  latch = createLatch();
  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource2} latch={latch} />
    </React.Suspense>,
  );

  // again, first we should see a fallback rendered

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  // now let's wait for data

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello ANOTHER"
}
  </pre>
</DocumentFragment>
`);
});

test("query: re-fetching with different params", async () => {
  let resource = Resource.defineQuery({
    endpoint,
    query: ``,
  });

  let rendered;
  let latch;

  mockFetch(200, { data: { message: "Hello" } });

  latch = createLatch();

  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} params={{ a: 1 }} latch={latch} />
    </React.Suspense>,
  );

  // first we should see a fallback rendered

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  // now let's wait for data

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);

  // now let's rerender with another resource

  mockFetch(200, { data: { message: "Hello ANOTHER" } });
  latch = createLatch();
  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} params={{ a: 2 }} latch={latch} />
    </React.Suspense>,
  );

  // again, first we should see a fallback rendered

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  // now let's wait for data

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello ANOTHER"
}
  </pre>
</DocumentFragment>
`);

  // back to first set of params

  mockFetch(200, { data: { message: "Hello" } });

  latch = createLatch();

  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} params={{ a: 1 }} latch={latch} />
    </React.Suspense>,
  );

  // we should see the data immediately

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);
});

test("mutation: happy path", async () => {
  let resource = Resource.defineQuery({
    endpoint,
    query: ``,
  });

  let mutation = Resource.defineMutation({
    endpoint,
    mutation: ``,
  });

  let rendered;
  let latch;

  mockFetch(200, { data: { message: "Hello" } });

  latch = createLatch();

  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} latch={latch} />
    </React.Suspense>,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "Hello"
}
  </pre>
</DocumentFragment>
`);

  // let's perform mutation now
  mockFetch(200, { data: { message: "done" } });
  await Resource.perform(mutation, {});

  // re-render and see it's refetching the resource
  latch = createLatch();
  rendered = ReactTesting.render(
    <React.Suspense fallback={<Fallback />}>
      <Component resource={resource} latch={latch} />
    </React.Suspense>,
  );

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <div>
    FALLBACK
  </div>
</DocumentFragment>
`);

  await latch.promise;

  expect(rendered.asFragment()).toMatchInlineSnapshot(`
<DocumentFragment>
  <pre>
    {
  "message": "done"
}
  </pre>
</DocumentFragment>
`);
});
