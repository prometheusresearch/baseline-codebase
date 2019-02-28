rexl.test.data = {
	'column':{value: 'some string', type:rexl.String},
	'another.string':{value: 'some string', type:rexl.String},
	'another column':{value: 99, type:rexl.Number},
	'yet.another.long.column':{value:100, type:rexl.Number},
	'n':{value:100, type:rexl.Number},
	'true.column':{value:true, type:rexl.Boolean},
	'false.column':{value:false, type:rexl.Boolean},
	'null.column':{value:null, type:rexl.Boolean},
  'nulllist.column': {value: null, type: rexl.List},
  'emptylist.column': {value: [], type: rexl.List},
  'list.column': {value: [rexl.Number.value(0), rexl.Number.value(1), rexl.Number.value(2)], type: rexl.List},
  'list2.column': {value: [rexl.Number.value(0), rexl.Number.value(1), rexl.Number.value(0)], type: rexl.List},
  'list3.column': {value: [rexl.Number.value(0), rexl.Number.value(1)], type: rexl.List},
  'liststring.column': {value: [rexl.String.value('foo'), rexl.String.value('bar'), rexl.String.value('baz')], type: rexl.List},
  'listfalse.column': {value: [rexl.Boolean.value(false), rexl.String.value(null)], type: rexl.List}
}

rexl.test.tests = [
    {
        query:"today() > '1980-08-01' & today() < '2100-01-01'",
        expect:true
    },
    {
        query:"count_true(1, true(), false(), 'abc', true.column, false.column, null.column, 0)",
        expect:4
    },
    {
        query:"n-'4'",
        expect:96
    },
    {
        query:"n-n",
        expect:0
    },
     {
        query:"5-'4'",
        expect:1
    },
    {
        query:"'4'+'4'+'5'+'6'",
        expect:'4456'
    },
    {
        query:"4+4+5+6",
        expect:19
    },
    {
        query:"n+'4' + n",
        expect:204
    },
    {
        query:"'4'+n",
        expect:104
    },
	{
	    query:"if(if(false(),3,0),5,if('abc',4,2))",
	    expect:4
	},
    {
        query:"n+4",
        expect:104
    },
    {
        query:"4+n",
        expect:104
    },
    {
        query:"n+n",
        expect:200
    },
    {
        query:"n*4",
        expect:400
    },
    {
        query:"4*n",
        expect:400
    },
    {
        query:"n*n",
        expect:10000
    },
    {
        query:"n/4",
        expect:25
    },
    {
        query:"4/n",
        expect:0.04
    },
    {
        query:"n/n",
        expect:1
    },
    {
		query:'yet.another.long.column > 99',
		expect:true
    },
//    {
//		query:'exists(true.column == true())',
//		expect:null
//    },
    {
		query:'null.column > 98 & null.column > 99',
		expect:null
    },
    {
		query:'"another column" > 98 & yet.another.long.column > 99',
		expect:true
    },
	{
		query:'"another column"&yet.another.long.column&\'\'',
		expect:false
	},
	{
		query:"column !=~~ '^SOME'",
		expect:true
	},
	{
		query:"another.string",
		expect:"some string"
	},
	{
		query:"'test'.length() != another.string.length()",
		expect:true
	},
	{
		query:"' test '.trim().length()",
		expect:4
	},
	{
		query:"'test'.length()",
		expect:4
	},
	{
		query:"pi()",
		expect:3.141592653589793
	},
	{
		query:"another.string.length()",
		expect:11
	},
	{
		query:"column !=~~ '^SOME'",
		expect:true
	},
	{
		query:"column =~~ '^\\w+\\s\\w+$'",
		expect:true
	},
	{
		query:"column =~~ '^SOME'",
		expect:false
	},
	{
		query:"column !=~ '^SOME'",
		expect:false
	},
	{
		query:"column =~ '^SOME'",
		expect:true
	},
	{
		query:"@table[some_locator] == @table[another_locator]",
		expect:false
	},
	{
		query:"@table[some_locator] == @table[some_locator]",
		expect:true
	},
	{
		query:"column == 'some string' & \"another column\" <= 110,120,130,99",
		expect:true
	},
	{
		query:"column == 'some string' & \"another column\" <= 10,20,30,99",
		expect:false
	},
	{
		query:"'A'<'B','C','D'",
		expect:true
	},
	{
		query:'yet.another.long.column==null()|yet.another.long.column!==null()',
		expect:true
	},
	{
		query:'yet.another.long.column=null()|yet.another.long.column!=null()',
		expect:null
	},
	{
		query:'yet.another.long.column==100',
		expect:true
	},
	{
		query:'false()&0|true.column|yet.another.long.column',
		expect:true
	},
	{
		query:'false()&0|"another column"|yet.another.long.column',
		expect:true
	},
	{
		query:'"another column"&yet.another.long.column&0',
		expect:false
	},
	{
		query:"null.column|null()",
		expect:null
	},
	{
		query:"!null.column|!null()",
		expect:null
	},
	{
		query:"false.column|null.column|true.column",
		expect:true
	},
	{
		query:"false()|null()|true()",
		expect:true
	},
	{
		query:"false()|null()",
		expect:null
	},
	{
		query:"false()&null()&true()",
		expect:false
	},
	{
		query:"null()&true()",
		expect:null
	},
  {
    query: "list.column|list2.column",
    expect: [false, true, true]
  },
  {
    query: "list.column&true()",
    expect: true
  },
  {
    query: "emptylist.column&true()",
    expect: false
  },
  {
    query: "list.column&list2.column",
    expect: [false, true, false]
  },
  {
    query: "list.column>1",
    expect: [false, false, true]
  },
  {
    query: "list2.column==0",
    expect: [true, false, true]
  },
  {
    query: "nulllist.column==null()",
    expect: null
  },
  {
    query: "liststring.column=='bar'",
    expect: [false, true, false]
  },
  {
    query: "list.column==list2.column",
    expect: [true, true, false]
  },
  {
    query: "list.column==list3.column",
    expect: [true, true, false]
  },
  {
    query: "liststring.column=~'^b.*'",
    expect: [false, true, true]
  },
  {
    query: "length(list.column)",
    expect: 3
  },
  {
    query: "length(nulllist.column)",
    expect: 0
  },
  {
    query: "count(list.column)",
    expect: 2
  },
  {
    query: "count(nulllist.column)",
    expect: 0
  },
  {
    query: "exists(list.column)",
    expect: true
  },
  {
    query: "exists(listfalse.column)",
    expect: false
  },
  {
    query: "exists(nulllist.column)",
    expect: false
  },
  {
    query: "every(list.column)",
    expect: false
  },
  {
    query: "every(nulllist.column)",
    expect: true
  },
  {
    query: "every(liststring.column)",
    expect: true
  },
  {
    query: "min(list.column)",
    expect: 0
  },
  {
    query: "min(nulllist.column)",
    expect: null
  },
  {
    query: "max(list.column)",
    expect: 2
  },
  {
    query: "max(nulllist.column)",
    expect: null
  },
  {
    query: "sum(list.column)",
    expect: 3
  },
  {
    query: "sum(list2.column)",
    expect: 1
  },
  {
    query: "sum(nulllist.column)",
    expect: 0
  },
  {
    query: "avg(list.column)",
    expect: 1
  },
  {
    query: "avg(nulllist.column)",
    expect: null
  }
]

rexl.test.callback = function(data) {
	var name = data.join('.');
	var val = rexl.test.data[name];
	if (val === undefined) {
	    console.log('val undefined on ', name);
	}
	
	return val.type.value(val.value);
}
