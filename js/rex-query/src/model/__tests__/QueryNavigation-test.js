// @noflow

import jestSerializeDomain from "../../../scripts/jest-serialize-domain";
import jestSerializeContext from "../../../scripts/jest-serialize-context";
expect.addSnapshotSerializer(jestSerializeDomain);
expect.addSnapshotSerializer(jestSerializeContext);

import type { Context, Domain } from "../types";

import * as d from "../Domain";
import * as t from "../Type";
import * as q from "../Query";
import * as qn from "../QueryNavigation";

const domain: Domain = t.createDomain({
  aggregate: {
    count: {
      name: "count",
      title: "Count",
      isAllowed: _type => true,
      makeType: type => t.numberType(type.domain)
    }
  },
  entity: {
    individual: domain => ({
      title: "Individual",
      attribute: {
        name: {
          title: "Name",
          type: t.textType(domain)
        },
        study_enrollment: {
          title: "Study Enrollment",
          type: t.seqType(t.entityType(domain, "study_enrollment"))
        }
      }
    }),
    study: domain => ({
      title: "Study",
      attribute: {
        name: {
          title: "Name",
          type: t.textType(domain)
        },
        study_enrollment: {
          title: "Study Enrollment",
          type: t.seqType(t.entityType(domain, "study_enrollment"))
        }
      }
    }),
    study_enrollment: domain => ({
      title: "Study Enrollment",
      attribute: {
        individual: {
          title: "Individual",
          type: t.entityType(domain, "individual")
        },
        study: {
          title: "Study",
          type: t.entityType(domain, "study")
        }
      }
    })
  }
});

function getContext(...path: Array<string>): Context {
  let query =
    path.length === 0
      ? q.here
      : q.pipeline(...path.map(path => q.navigate(path)));
  return q.inferType(domain, query).context;
}

test("context: void", function() {
  let context = getContext();
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: individual", function() {
  let context = getContext("individual");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: individual.study_enrollment", function() {
  let context = getContext("individual", "study_enrollment");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: individual.study_enrollment.study.name", function() {
  let context = getContext("individual", "study_enrollment", "study", "name");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: individual.name", function() {
  let context = getContext("individual", "name");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: study", function() {
  let context = getContext("study");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("context: study.study_enrollment", function() {
  let context = getContext("study", "study_enrollment");
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});

test("with query in scope", function() {
  let query = q.pipeline(
    q.def("individual-query", q.pipeline(q.navigate("individual")))
  );
  let context = q.inferType(domain, query).context;
  let navigation = qn.getNavigation(context);
  expect(navigation).toMatchSnapshot();
});
