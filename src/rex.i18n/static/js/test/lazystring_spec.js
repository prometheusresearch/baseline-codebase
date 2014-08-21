'use strict';


var LazyString = require('../lib/lazystring').LazyString;


describe('LazyString', function () {
  var testFunc;

  beforeEach(function () {
    testFunc = jasmine.createSpy('testFunc').and.callFake(function () {
      return 'hello';
    });
  });

  afterEach(function () {
    testFunc.calls.reset();
  });

  it('does not evaluate upon creation', function () {
    LazyString(testFunc);
    expect(testFunc.calls.count()).toBe(0);
  });

  it('evaluates upon casting to string', function () {
    var ls = new LazyString(testFunc),
      foo;

    foo = ls + String();
    expect(testFunc.calls.count()).toBe(1);
    expect(foo).toBe('hello');

    foo = String(ls);
    expect(testFunc.calls.count()).toBe(2);
    expect(foo).toBe('hello');
  });

  it('evaluates upon comparison', function () {
    /*jshint eqeqeq:false */
    var ls = new LazyString(testFunc),
      foo;

    foo = (ls == 1);
    expect(testFunc.calls.count()).toBe(1);
    expect(foo).toBe(false);

    foo = (ls == 'hello');
    expect(testFunc.calls.count()).toBe(2);
    expect(foo).toBe(true);
  });

  it('does not evaluate upon strict comparison', function () {
    var ls = new LazyString(testFunc),
      foo;

    foo = (ls === 1);
    expect(testFunc.calls.count()).toBe(0);
    expect(foo).toBe(false);

    foo = (ls === 'hello');
    expect(testFunc.calls.count()).toBe(0);
    expect(foo).toBe(false);
  });

});

