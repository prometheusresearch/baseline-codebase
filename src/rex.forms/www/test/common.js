
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
    var rexFormsClient = new $.RexFormsClient({
            mode: o.mode || 'normal',
            formMeta: o.formMeta || J.form,
            formData: o.formData || null,
            instrumentName: o.instrumentName || 'test',
            showNumbers: o.showNumbers || false,
            assessment: o.assessment || 'test-assessment',
            saveBeforeComplete: o.saveBeforeComplete || false,
            saveURL: {{ (PREFIX['rex.forms'] + '/save_state')|json }},
            formArea: o.formArea || ('#' + prefix + 'survey'),
            questionArea: o.questionArea || ('#' + prefix + 'questions'),
            pageTitleArea: o.pageTitleArea || ('#' + prefix + 'page_title'),
            pageIntroductionArea: o.pageIntroductionArea || ('#' + prefix + 'page_introduction'),
            formTitleArea: o.formTitleArea || ('#' + prefix + 'form_title'),
            btnPrev: o.btnPrev || ('#' + prefix + 'btnPrev'),
            btnNext: o.btnNext || ('#' + prefix + 'btnNext'),
            ignoreBookmark: (o.ignoreBookmark === true || o.ignoreBookmark === false) ? o.ignoreBookmark : true,
            templates: o.templates || null,
            events: o.events || null
        });
    return rexFormsClient;
}
