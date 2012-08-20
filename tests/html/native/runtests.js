document.addEventListener("DOMContentLoaded", function() {
    var jasmineEnv = jasmine.getEnv();
    var reporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(reporter);
    jasmineEnv.execute();
});
