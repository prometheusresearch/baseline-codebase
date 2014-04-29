rexl.test.data = {
	'column':{value: 'some string', type:rexl.String},
	'another.string':{value: 'some string', type:rexl.String},
	'another column':{value: 99, type:rexl.Number},
	'yet.another.long.column':{value:100, type:rexl.Number},
	'n':{value:100, type:rexl.Number},
	'true.column':{value:true, type:rexl.Boolean},
	'false.column':{value:false, type:rexl.Boolean},
	'null.column':{value:null, type:rexl.Boolean}
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
