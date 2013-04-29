
(function () {

var builderNS = $.RexFormsBuilder = $.RexFormsBuilder || {};

builderNS.isValidNumeric = function(val, condType) {
    return (
        (condType === 'integer'
            && /^[0-9]+$/.test(val)) ||
        (condType === 'float'
            && /^([+-]?(((\d+(\.)?)|(\d*\.\d+))([eE][+-]?\d+)?))$/.test(val))
    );
}

builderNS.isValidDate = function (year, month, day) {
    --month;
    var d = new Date(year, month, day);
    return (d.getDate() == day &&
            d.getMonth() == month &&
            d.getFullYear() == year);
}

builderNS.getRandomStr = function(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                 + "abcdefghijklmnopqrstuvwxyz0123456789";

    for(var i = 0; i < len; i++)
        text += possible.charAt(
                    Math.floor(Math.random() * possible.length)
                );

    return text;
}

builderNS.getCId = function(prefix) {
    var cId = prefix + '_';
    cId += builderNS.getRandomStr(10);
    // TODO: check for uniqness inside current instrument
    return cId;
}

builderNS.isNumericType = function(type) {
    return (type === 'integer' || type == 'float');
}

builderNS.isListType = function(type) {
    return (type === 'set' || type == 'enum'); 
}

builderNS.escapeHTML = function(str) {
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

builderNS.getReadableId = function(str, handlePrefix, delim, maxlen) {
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


})();
