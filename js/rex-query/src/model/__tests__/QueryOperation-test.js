/**
 * @noflow
 */

import { strip } from "./util";

import * as t from "../Type";
import {
  here,
  pipeline,
  select,
  navigate,
  def,
  filter,
  value,
  inferType
} from "../Query";
import { loc } from "../QueryLoc";
import {
  growNavigation,
  reconcileNavigation,
  insertAfter,
  remove
} from "../QueryOperation";

describe("insertAfter()", function() {
  let individual = navigate("individual");
  let name = navigate("name");
  let sample = navigate("sample");

  it('inserts "name" after "individual"', function() {
    let focusQuery = individual;
    let query = pipeline(individual);
    let what = [name];
    let expectedQuery = pipeline(individual, name);
    expect(
      strip(
        insertAfter({
          loc: loc(query, focusQuery),
          what
        })
      )
    ).toEqual(strip(expectedQuery));
  });

  it('inserts "name" after "individual.sample.[]"', function() {
    let focusQuery = sample;
    let query = pipeline(individual, sample);
    let what = [name];
    let expectedQuery = pipeline(individual, sample, name);
    expect(
      strip(
        insertAfter({
          loc: loc(query, focusQuery),
          what
        })
      )
    ).toEqual(strip(expectedQuery));
  });

  it('inserts "name" after "individual.[ ].sample"', function() {
    let focusQuery = individual;
    let query = pipeline(individual, sample);
    let what = [name];
    let expectedQuery = pipeline(individual, name, sample);
    expect(
      strip(
        insertAfter({
          loc: loc(query, focusQuery),
          what
        })
      )
    ).toEqual(strip(expectedQuery));
  });

  it('inserts "name" after "individual:define(a = sample.[ ])', function() {
    let focusQuery = sample;
    let query = pipeline(individual, def("a", pipeline(sample)));
    let what = [name];
    let expectedQuery = pipeline(individual, def("a", pipeline(sample, name)));
    expect(
      strip(
        insertAfter({
          loc: loc(query, focusQuery),
          what
        })
      )
    ).toEqual(strip(expectedQuery));
  });
});

describe("remove()", function() {
  let individual = navigate("individual");
  let name = navigate("name");
  let sample = navigate("sample");

  it("individual.name!", function() {
    let focusQuery = name;
    let query = pipeline(individual, name);
    let expectedQuery = pipeline(individual);
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual!.name", function() {
    let focusQuery = individual;
    let query = pipeline(individual, name);
    let expectedQuery = pipeline(name);
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual:select(a = sample.name!)", function() {
    let focusQuery = name;
    let query = pipeline(
      individual,
      select({
        a: pipeline(sample, name)
      })
    );
    let expectedQuery = pipeline(
      individual,
      select({
        a: pipeline(sample)
      })
    );
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual:select(a = [sample!])", function() {
    let focusQuery = sample;
    let query = pipeline(
      individual,
      select({
        a: pipeline(sample)
      })
    );
    let expectedQuery = pipeline(individual);
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual:select(a = sample.name!, b = sample)", function() {
    let focusQuery = name;
    let query = pipeline(
      individual,
      select({
        a: pipeline(sample, name),
        b: pipeline(sample)
      })
    );
    let expectedQuery = pipeline(
      individual,
      select({
        a: pipeline(sample),
        b: pipeline(sample)
      })
    );
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual:define(a := sample!)", function() {
    let focusQuery = sample;
    let query = pipeline(individual, def("a", pipeline(sample)));
    let expectedQuery = pipeline(individual);
    expect(strip(remove({ loc: loc(query, focusQuery) }))).toEqual(
      strip(expectedQuery)
    );
  });
});

describe("growNavigation()", function() {
  let a = navigate("a");
  let b = navigate("b");
  let c = navigate("c");

  it("grows a on here", function() {
    let query = pipeline(here);
    let expectedQuery = pipeline(here, select({ a: pipeline(a) }));
    let path = ["a"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows a.b on here", function() {
    let query = pipeline(here);
    let expectedQuery = pipeline(
      here,
      select({
        a: pipeline(a, select({ b: pipeline(b) }))
      })
    );
    let path = ["a", "b"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows a.b.c on here", function() {
    let query = pipeline(here);
    let expectedQuery = pipeline(
      here,
      select({
        a: pipeline(
          a,
          select({
            b: pipeline(
              b,
              select({
                c: pipeline(c)
              })
            )
          })
        )
      })
    );
    let path = ["a", "b", "c"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows a.b on here:select(a := a)", function() {
    let query = pipeline(here, select({ a: pipeline(a) }));
    let expectedQuery = pipeline(
      here,
      select({
        a: pipeline(a, select({ b: pipeline(b) }))
      })
    );
    let path = ["a", "b"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows a.b on here:filter():select(a := a)", function() {
    let query = pipeline(here, filter(value(true)), select({ a: pipeline(a) }));
    let expectedQuery = pipeline(
      here,
      filter(value(true)),
      select({
        a: pipeline(a, select({ b: pipeline(b) }))
      })
    );
    let path = ["a", "b"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows a.b.c on here:select(a := a)", function() {
    let query = pipeline(here, select({ a: pipeline(a) }));
    let expectedQuery = pipeline(
      here,
      select({
        a: pipeline(
          a,
          select({
            b: pipeline(b, select({ c: pipeline(c) }))
          })
        )
      })
    );
    let path = ["a", "b", "c"];
    expect(strip(growNavigation({ loc: loc(query, here), path }))).toEqual(
      strip(expectedQuery)
    );
  });

  it("grows b.c on here:select(a := [a])", function() {
    let focusQuery = a;
    let query = pipeline(here, select({ a: pipeline(focusQuery) }));
    let expectedQuery = pipeline(
      here,
      select({
        a: pipeline(
          a,
          select({
            b: pipeline(b, select({ c: pipeline(c) }))
          })
        )
      })
    );
    let path = ["b", "c"];
    expect(
      strip(growNavigation({ loc: loc(query, focusQuery), path }))
    ).toEqual(strip(expectedQuery));
  });

  it("grows b on here:define(a := [a])", function() {
    let focusQuery = a;
    let query = pipeline(here, def("a", pipeline(focusQuery)));
    let expectedQuery = pipeline(
      here,
      def("a", pipeline(a, select({ b: pipeline(b) })))
    );
    let path = ["b"];
    expect(
      strip(growNavigation({ loc: loc(query, focusQuery), path }))
    ).toEqual(strip(expectedQuery));
  });
});

describe("reconcileNavigation()", function() {
  const domain = t.createDomain({
    entity: {
      individual: domain => ({
        title: "individual",
        attribute: {
          name: {
            title: "name",
            type: t.textType(domain)
          },
          age: {
            title: "age",
            type: t.numberType(domain)
          },
          study: {
            title: "study",
            type: t.entityType(domain, "study")
          }
        }
      }),
      study: domain => ({
        title: "study",
        attribute: {
          name: {
            title: "name",
            type: t.textType(domain)
          }
        }
      })
    },
    aggregate: {}
  });

  const individual = navigate("individual");
  const study = navigate("study");
  const name = navigate("name");
  const age = navigate("age");

  it("individual", function() {
    let query = pipeline(here, individual);
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual", function() {
    let query = pipeline(here, individual);
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:define(q := name)", function() {
    let query = pipeline(here, def("q", pipeline(individual)));
    let expectedQuery = pipeline(
      here,
      def(
        "q",
        pipeline(
          individual,
          select({
            age: pipeline(age),
            name: pipeline(name),
            study: pipeline(study)
          })
        )
      )
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:define(q := name) pipeline.1", function() {
    let query = pipeline(here, def("q", pipeline(individual)));
    let expectedQuery = pipeline(
      here,
      def(
        "q",
        pipeline(
          individual,
          select({
            age: pipeline(age),
            name: pipeline(name),
            study: pipeline(study)
          })
        )
      )
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:define()", function() {
    let query = pipeline(here, individual, def("q", pipeline(name)));
    let expectedQuery = pipeline(
      here,
      individual,
      def("q", pipeline(name)),
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:define() pipeline.2:binding.query", function() {
    let query = pipeline(here, individual, def("q", pipeline(name)));
    let expectedQuery = pipeline(
      here,
      individual,
      def("q", pipeline(name)),
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:define() pipeline.1", function() {
    let query = pipeline(here, individual, def("q", pipeline(name)));
    let expectedQuery = pipeline(
      here,
      individual,
      def("q", pipeline(name)),
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:select(name:define()) pipeline.1", function() {
    let query = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:select(name:define()) pipeline.2 select.name pipeline.0", function() {
    let query = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:select(name:define()) pipeline.2 select.name pipeline.1", function() {
    let query = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual:select(name:define()) pipeline.2 select.name pipeline.1 binding.query", function() {
    let query = pipeline(
      here,
      individual,
      select({ name: pipeline(name, def("q", pipeline(name))) })
    );
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name, def("q", pipeline(name)))
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:individual pipeline.1", function() {
    let query = pipeline(here, individual);
    let expectedQuery = pipeline(
      here,
      individual,
      select({
        name: pipeline(name),
        age: pipeline(age),
        study: pipeline(study)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("individual:select(name)", function() {
    let query = pipeline(here, select({ individual: pipeline(individual) }));
    let expectedQuery = pipeline(
      here,
      select({
        individual: pipeline(individual)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });

  it("here:select(individual)", function() {
    let query = pipeline(here, select({ individual: pipeline(individual) }));
    let expectedQuery = pipeline(
      here,
      select({
        individual: pipeline(individual)
      })
    );
    expect(strip(reconcileNavigation(inferType(domain, query)))).toEqual(
      strip(expectedQuery)
    );
  });
});
