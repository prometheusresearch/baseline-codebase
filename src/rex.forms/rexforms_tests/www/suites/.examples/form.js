module("form", {
    setup: function() {
        HTRAF.cache.individual = J.individual_identity_1;
        node().html('<form id="individual" '
                    + 'data-htsql="/individual{id(), *, identity{*}}" '
                    + '></form>'); 
    }
});

test('"edit" mode renders properly', function() {
    node('form').attr('data-mode', 'edit').widgetize().htrafProc('load');

    stop()
});
