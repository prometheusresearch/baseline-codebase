rexl.test.data = {
    'f_Untyped':rexl.Untyped,
    'f_Number':rexl.Number,
    'f_Boolean':rexl.Boolean,
    'f_String':rexl.String
};

rexl.test.callback = function(data) {
	var name = data.join('.');
	var cls = rexl.test.data[name];
    //console.debug(name);
    return rexl.type(cls);
}

rexl.test.tests = [
    {
        query:"f_String>'1'&f_Number<1|'1'==1|'a'<='b'&!('a'>='b')",
        expect: rexl.Boolean
    }, 
    {
        query:"f_String='1'&f_Number!=f_String|'1'==1",
        expect: 'error'
    }, 
    {
        query:"is_false(true())&(true()|!null())", 
        expect:rexl.Boolean
    }, 
    {
        query:"is_true(false())", 
        expect:rexl.Boolean
    }, 
    {
        query:"null()", 
        expect:rexl.Untyped
    }, 
    {
        query:"coalesce(1, 2, f_Number)", 
        expect:rexl.Number
    }, 
    {
        query:"coalesce(1, null(), 2, 3)", 
        expect:rexl.Number
    }, 
    {
        query:"coalesce(1, null(), '2', '3')", 
        expect:rexl.Number
    } 
];
