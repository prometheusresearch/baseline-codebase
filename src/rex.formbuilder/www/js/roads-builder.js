(function($) {

function extend(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
}

function isValidNumeric(val, condType) {
    return (
        (condType === 'integer'
            && /^[0-9]+$/.test(val)) ||
        (condType === 'float'
            && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
    );
}

function objSize (obj) {
    var size = 0, key;
    for (key in obj)
        if (obj.hasOwnProperty(key))
            size++;
    return size;
};

function isValidDate(year, month, day) {
    --month;
    var d = new Date(year, month, day);
    return (d.getDate() == day &&
            d.getMonth() == month &&
            d.getFullYear() == year);
}

function defined(something) {
    return (something === undefined);
}

function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function rexlize(val) {
    if (null === val)
        return rexl.String.value(null);

    type = toType(val);

    if ('number' === type)
        return rexl.Number.value(val);
    else if ('string' === type)
        return rexl.String.value(val);
    else if ('boolean' === type)
        return rexl.Boolean.value(val);

    throw('RexlTypeError');
}

var Form = function () {
    var self = this;
}

var Group = function () {

}

var Page = function () {

}

var Answer = function (code, title) {
    this.code = code;
    this.title = title;
}

var BaseQuestion = function (def) {
    this.name = def.name;
    this.title = def.title || '';
    this.type = def.type;
    this.required = def.required || false;
    this.disableIf = def.disableIf || null;
    this.dropDown = def.dropDown || false;
    def.customTitles = {};
    for (var item in def.customTitles)
        this.customTitles[item] = def.customTitles[item];
    this.answers = [];
    for (var answer in def.answers) {
        
    }
}

var EnumQuestion = function (def) {
    
}

$.RexFormsBuilder = function (o) {
    var self = this;

}

})(jQuery);

// vim: set foldmethod=marker:
