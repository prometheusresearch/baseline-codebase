import {make, add, remove, merge} from '../FieldList';

describe('add()', function(){

  it('adds a field to an empty field list', function(){
    let fieldList = [];
    expect(add(fieldList, ['study'])).toEqual([
      make('study')
    ]);
  });

  it('adds a field to a field list', function(){
    let fieldList = [make('protocol')];
    expect(add(fieldList, ['study'])).toEqual([
      make('protocol'),
      make('study')
    ]);
  });

  it('adds a sub field to a field list', function(){
    let fieldList = [make('protocol'), make('study'), make('something')];
    expect(add(fieldList, ['study', 'code'])).toEqual([
      make('protocol'),
      make('study', make('code')),
      make('something'),
    ]);
  });

  it('adds a sub field to a field list (subfield exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    expect(add(fieldList, ['study', 'title'])).toEqual([
      make('protocol'),
      make('study', make('code'), make('title')),
      make('something'),
    ]);
  });

});

describe('remove()', function(){

  it('removes a field from an empty list', function(){
    let fieldList = [];
    expect(remove(fieldList, ['study'])).toEqual([
    ]);
  });

  it('removes a non-existent field from a list', function(){
    let fieldList = [make('protocol')];
    expect(remove(fieldList, ['study'])).toEqual([
      make('protocol'),
    ]);
  });

  it('removes a field from a list', function(){
    let fieldList = [make('protocol')];
    expect(remove(fieldList, ['protocol'])).toEqual([

    ]);
  });

  it('removes a non-existent sub field to a field list', function(){
    let fieldList = [make('protocol'), make('study'), make('something')];
    expect(remove(fieldList, ['study', 'code'])).toEqual([
      make('protocol'),
      make('something'),
    ]);
  });

  it('adds a non-existent sub field to a field list (another exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    expect(remove(fieldList, ['study', 'title'])).toEqual([
      make('protocol'),
      make('study', make('code')),
      make('something'),
    ]);
  });

  it('adds a non-existent sub field to a field list (another exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    expect(remove(fieldList, ['study', 'code'])).toEqual([
      make('protocol'),
      make('something'),
    ]);
  });

  it('adds a field to a field list (subfield exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    expect(remove(fieldList, ['study'])).toEqual([
      make('protocol'),
      make('something'),
    ]);
  });

});

describe('merge()', function(){

  it('merges a field to an empty field list', function(){
    let fieldList = [];
    let toMerge = [make('study')];
    expect(merge(fieldList, toMerge)).toEqual([
      make('study')
    ]);
  });

  it('merges a field to a field list', function(){
    let fieldList = [make('protocol')];
    let toMerge = [make('study')];
    expect(merge(fieldList, toMerge)).toEqual([
      make('protocol'),
      make('study')
    ]);
  });

  it('merges fields to a field list', function(){
    let fieldList = [make('protocol')];
    let toMerge = [make('study'), make('identity')];
    expect(merge(fieldList, toMerge)).toEqual([
      make('protocol'),
      make('study'),
      make('identity'),
    ]);
  });

  it('merges a sub field to a field list', function(){
    let fieldList = [make('protocol'), make('study'), make('something')];
    let toMerge = [make('study', make('code'))];
    expect(merge(fieldList, toMerge)).toEqual([
      make('protocol'),
      make('study', make('code')),
      make('something'),
    ]);
  });

  it('merges a sub field to a field list (subfield exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    let toMerge = [make('study', make('title'))];
    expect(merge(fieldList, toMerge)).toEqual([
      make('protocol'),
      make('study', make('code'), make('title')),
      make('something'),
    ]);
  });

  it('merges subfields to a field list (subfield exists)', function(){
    let fieldList = [make('protocol'), make('study', make('code')), make('something')];
    let toMerge =[make('study', make('title')), make('protocol', make('code'))];
    expect(merge(fieldList, toMerge)).toEqual([
      make('protocol', make('code')),
      make('study', make('code'), make('title')),
      make('something'),
    ]);
  });

});
