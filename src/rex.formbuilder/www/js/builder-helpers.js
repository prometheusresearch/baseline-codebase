
(function () {

var builder = $.RexFormBuilder = $.RexFormBuilder || {};

builder.getIllegalIdChars = function (separator) {
    return new RegExp("(^[^a-zA-Z])|([^a-zA-Z0-9\\" + separator + "]+)", "g");
};

builder.illegalIdChars = builder.getIllegalIdChars("_");
    // new RegExp("(^[^a-zA-Z])|([^a-zA-Z0-9_]+)", "g");

builder.keys = function (array) {
    var ret = [];
    for (var k in array)
        ret.push(k);
    return ret;
}

builder.isValidNumeric = function(val, condType) {
    return (
        (condType === 'integer'
            && /^[0-9]+$/.test(val)) ||
        (condType === 'float'
            && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
    );
}

builder.isValidDate = function (year, month, day) {
    --month;
    var d = new Date(year, month, day);
    return (d.getDate() == day &&
            d.getMonth() == month &&
            d.getFullYear() == year);
}

builder.getRandomStr = function(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                 + "abcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++)
        text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );

    return text;
}

builder.getCId = function(prefix) {
    var cId = prefix + '_';
    cId += builder.getRandomStr(10);
    // TODO: check for uniqness inside current instrument
    return cId;
}

builder.isNumericType = function(type) {
    return (type === 'integer' || type == 'float');
}

builder.isListType = function(type) {
    return (type === 'set' || type == 'enum'); 
}

builder.escapeHTML = function(str) {
    return $(document.createElement('div')).text(str).html();
}

var notAllowedChars = new RegExp("[^a-zA-Z0-9\\s_\\-\\/]+", "g");
var stopWords = {
    'is': true,
    'the': true,
    'of': true,
    'and': true,
    'a': true,
    'an': true,
    'for': true,
    'in': true,
    'to': true
};
var abbreviations = {
    diagnosis: 'dx',
    equivalent: 'equiv',
    confidence: 'conf',
    develop: 'dev',
    development: 'dev',
    developmental: 'dev',
    neurological: 'neuro',
    specify: 'spec',
    describe: 'desc',
    description: 'desc',
    positive: 'pos',
    negative: 'neg',
    seizure: 'seiz',
    seizures: 'seiz',
    unknown: 'unk',
    surgery: 'surg',
    medication: 'med',
    pregnancy: 'preg',
    pregnant: 'preg',
    functioning: 'func',
    functional: 'func',
    'function': 'func',
    communication: 'comm',
    communicate: 'comm',
    classification: 'class'
};

builder.getReadableId = function(str, handlePrefix, delim, maxlen) {
    str = str.replace(notAllowedChars, '');
    var len = str.length;
    var result = '';
    var word = '';
    var begin = true;
    var ch;
    for (i = 0; i <= len; i++) {
        ch = str.charAt(i);
        if ((ch >= 'a' && ch <= 'z') ||
            (ch >= '0' && ch <= '9'))
            word += ch;
        else if (ch >= 'A' && ch <= 'Z')
            word += ch.toLowerCase();
        else if (word) {
            if (!stopWords[word]) {
                if (abbreviations[word])
                    word = abbreviations[word];
                if (result)
                    result += delim + word;
                else {
                    if (handlePrefix) {
                        var matches = 
                                word.match(/^([a-z]{0,1})(\d+)(.*)$/);
                    
                        if (matches !== null) {
                            if (parseInt(matches[2]) + 0 < 10)
                                matches[2] = '0' + matches[2];
                            if (matches[1] === '')
                                matches[1] = 'q';
                            word = matches[1] 
                                    + matches[2]
                                    + matches[3];
                        }
                    }
                    result = word;
                    begin = false;
                }
            } else
                begin = false;
            word = '';
            if (result.length >= maxlen) {
                if (result.charAt(maxlen - 1) === delim)
                    --maxlen; 
                result = result.substr(0, maxlen);
                break;
            }
        }
    }

    return result;
}

builder.extend = function (Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
}

builder.truncateText = function(text, len) {
    if (text.length > len)
        return text.slice(0, len - 3) + "...";
    return text;
}

builder.paramTypeTitle = function(type, extParamTypes) {
    switch (type) {
    case 'NUMBER':
        return 'Number';
    case 'STRING':
        return 'String';
    case 'DATE':
        return 'Date';
    default:
        if (extParamTypes && extParamTypes[type])
            return extParamTypes[type];
    }
    return 'Unknown';
}


})();
