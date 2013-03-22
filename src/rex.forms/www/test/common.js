
function objSize (obj) {
    var size = 0, key;
    for (key in obj)
        if (obj.hasOwnProperty(key))
            size++;
    return size;
};

function getPageTemplate(prefix) {
    if (prefix)
        prefix += '_';
    else
        prefix = '';
    return '<div id="' + prefix + 'survey">'
        +   '<div id="' + prefix + 'form_title"></div>'
        +   '<div id="' + prefix + 'page_title"></div>'
        +   '<div id="' + prefix + 'page_introduction"></div>'
        +   '<div id="' + prefix + 'questions"></div>'
        +   '<button id="' + prefix + 'btnPrev">Previous Page</button>'
        +   '<button id="' + prefix + 'btnNext">Next Page</button>'
        +  '</div>';
}

function createRexFormsClient(o, prefix) {
    o = o || {};
    if (prefix)
        prefix += '_';
    else
        prefix = '';
    var events = {
        'saveError': function (retData) {
            retData.cancel = true;
        }
    };
    var rexFormsClient = new $.RexFormsClient({
            mode: o.mode || 'normal',
            formMeta: o.formMeta || J.formBasic,
            formData: o.formData || null,
            instrumentName: o.instrumentName || 'test',
            showNumbers: o.showNumbers || false,
            assessment: o.assessment || 'test-assessment',
            saveBeforeComplete: o.saveBeforeComplete || false,
            saveURL: '/test/save_state',
            formArea: o.formArea || ('#' + prefix + 'survey'),
            questionArea: o.questionArea || ('#' + prefix + 'questions'),
            pageTitleArea: o.pageTitleArea || ('#' + prefix + 'page_title'),
            pageIntroductionArea: o.pageIntroductionArea || ('#' + prefix + 'page_introduction'),
            formTitleArea: o.formTitleArea || ('#' + prefix + 'form_title'),
            btnPrev: o.btnPrev || ('#' + prefix + 'btnPrev'),
            btnNext: o.btnNext || ('#' + prefix + 'btnNext'),
            ignoreBookmark: (o.ignoreBookmark === true || o.ignoreBookmark === false) ? o.ignoreBookmark : true,
            templates: o.templates || null,
            events: o.events || events
        });
    return rexFormsClient;
}

function parseQueryString(a) {
    a = a.split('&')
    if (a == "")
        return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
        var p = a[i].split('=');
        if (p.length != 2)
            continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}
