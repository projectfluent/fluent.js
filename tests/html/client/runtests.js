(function() {
    var jasmineEnv = jasmine.getEnv();
    var reporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(reporter);
    document.addEventListener("LocalizationReady", function() {
        jasmineEnv.execute();
    });
})();
