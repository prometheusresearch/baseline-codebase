'use strict';

var assert  = require('assert');
var Storage = require('../Storage');
var Immutable = require('immutable');

function assertEquals(a, b) {
  assert.ok(
    Immutable.is(a, b),
    `${a} does not equal to ${b}`
  );
}

describe('Storage', function() {

  var storage;

  beforeEach(function() {
    storage = new Storage();
  });

  describe('adding entities to storage', function() {

    it('denormalizes one-to-one relations', function() {
      var data = {
        study: {
          id: 1,
          name: 'Study',
          protocol: {
            id: 2,
            name: 'Protocol'
          }
        }
      };

      storage.add(data);

      var study = new Storage.Ref(storage, 'study', 1).resolve();
      assertEquals(
        study,
        Immutable.Map({
          id: 1,
          name: 'Study',
          protocol: new Storage.Ref(storage, 'protocol', 2)
        })
      );

      var protocol = new Storage.Ref(storage, 'protocol', 2).resolve();
      assertEquals(
        protocol,
        Immutable.Map({
          id: 2,
          name: 'Protocol'
        })
      );
      assertEquals(
        protocol,
        study.get('protocol').resolve()
      );
    });

    it('denormalizes one-to-many relations', function() {
      var data = {
        study: {
          id: 1,
          name: 'Study',
          protocol: [
            {
              id: 1,
              name: 'Protocol1'
            },
            {
              id: 2,
              name: 'Protocol2'
            }
          ]
        }
      };

      storage.add(data);

      var study = new Storage.Ref(storage, 'study', 1).resolve();
      assertEquals(
        study,
        Immutable.Map({
          id: 1,
          name: 'Study',
          protocol: Immutable.List([
            new Storage.Ref(storage, 'protocol', 1),
            new Storage.Ref(storage, 'protocol', 2)
          ])
        })
      );

      var protocol1 = new Storage.Ref(storage, 'protocol', 1).resolve();
      assertEquals(
        protocol1,
        Immutable.Map({
          id: 1,
          name: 'Protocol1'
        })
      );
      assertEquals(
        protocol1,
        study.get('protocol').get(0).resolve()
      );

      var protocol2 = new Storage.Ref(storage, 'protocol', 2).resolve();
      assertEquals(
        protocol2,
        Immutable.Map({
          id: 2,
          name: 'Protocol2'
        })
      );
      assertEquals(
        protocol2,
        study.get('protocol').get(1).resolve()
      );
    });

    it('merges entities', function() {

      var data = {
        study: {
          id: 1,
          name: 'Study',
          protocol: [
            {
              id: 1,
              name: 'Protocol1'
            },
            {
              id: 2,
              name: 'Protocol2'
            }
          ]
        }
      };

      storage.add(data);

      var update = {
        protocol: {
          id: 1,
          extra: 'protocol',
          study: {
            id: 1,
            extra: 'study'
          }
        }
      };

      storage.add(update);

      var study = new Storage.Ref(storage, 'study', 1).resolve();
      assertEquals(
        study,
        Immutable.Map({
          id: 1,
          extra: 'study',
          name: 'Study',
          protocol: Immutable.List([
            new Storage.Ref(storage, 'protocol', 1),
            new Storage.Ref(storage, 'protocol', 2)
          ])
        })
      );

      var protocol = new Storage.Ref(storage, 'protocol', 1).resolve();
      assertEquals(
        protocol,
        Immutable.Map({
          id: 1,
          extra: 'protocol',
          name: 'Protocol1',
          study: new Storage.Ref(storage, 'study', 1)
        })
      );
    });

  });

  it('can traverse entities using JSON pointer', function() {

    var data = {
      study: {
        id: 1,
        name: 'Study',
        protocol: [
          {
            id: 1,
            name: 'Protocol1'
          },
          {
            id: 2,
            name: 'Protocol2'
          }
        ],
        visit: {
          id: 3,
          name: 'Visit'
        }
      }
    };

    storage.add(data);

    assertEquals(
      storage.resolve('/study/1'),
      Immutable.Map({
        id: 1,
        name: 'Study',
        protocol: Immutable.List([
          new Storage.Ref(storage, 'protocol', 1),
          new Storage.Ref(storage, 'protocol', 2)
        ]),
        visit: new Storage.Ref(storage, 'visit', 3)
      })
    );

    assertEquals(
      storage.resolve('/study/1/id'),
      1
    );

    assertEquals(
      storage.resolve('/study/1/name'),
      'Study'
    );

    assertEquals(
      storage.resolve('/study/1/visit'),
      Immutable.Map({
        id: 3,
        name: 'Visit'
      })
    );

    assertEquals(
      storage.resolve('/study/1/visit/id'),
      3
    );

    assertEquals(
      storage.resolve('/study/1/visit/name'),
      'Visit'
    );

    assertEquals(
      storage.resolve('/study/1/protocol'),
      Immutable.List([
        Immutable.Map({
          id: 1,
          name: 'Protocol1'
        }),
        Immutable.Map({
          id: 2,
          name: 'Protocol2'
        })
      ])
    );

    assertEquals(
      storage.resolve('/study/1/protocol/0'),
      Immutable.Map({
        id: 1,
        name: 'Protocol1'
      })
    );

    assertEquals(
      storage.resolve('/study/1/protocol/0/id'),
      1
    );

    assertEquals(
      storage.resolve('/study/1/protocol/1/id'),
      2
    );

  });

});
