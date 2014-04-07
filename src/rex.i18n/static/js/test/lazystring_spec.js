'use strict';


var i18n = require('../lib/index.js');
var expect = require('chai').expect;


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
        var ls = new i18n.LazyString(testFunc);
        expect(testFunc.calls.count()).to.equal(0);
    });

    it('evaluates upon casting to string', function () {
        var ls = new i18n.LazyString(testFunc),
            foo;

        foo = ls + String();
        expect(testFunc.calls.count()).to.equal(1);
        expect(foo).to.equal('hello');

        foo = String(ls);
        expect(testFunc.calls.count()).to.equal(2);
        expect(foo).to.equal('hello');
    });

    it('evaluates upon comparison', function () {
        /*jslint eqeq: true */

        var ls = new i18n.LazyString(testFunc),
            foo;

        foo = (ls == 1);
        expect(testFunc.calls.count()).to.equal(1);
        expect(foo).to.be.false;

        foo = (ls == 'hello');
        expect(testFunc.calls.count()).to.equal(2);
        expect(foo).to.be.true;
    });

    it('does not evaluate upon strict comparison', function () {
        var ls = new i18n.LazyString(testFunc),
            foo;

        foo = (ls === 1);
        expect(testFunc.calls.count()).to.equal(0);
        expect(foo).to.be.false;

        foo = (ls === 'hello');
        expect(testFunc.calls.count()).to.equal(0);
        expect(foo).to.be.false;
    });

});

