"use strict";

import assert from "assert";

import FluentBundle from "../src/bundle";
import { ftl } from "../src/util";

suite("Macros", function() {
  let bundle, errs;

  setup(function() {
    errs = [];
  });

  suite("References and calls", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
      });
      bundle.addMessages(ftl`
        -bar = Bar
        term-ref = {-bar}
        term-call = {-bar()}
      `);
    });

    test("terms can be referenced without parens", function() {
      const val = bundle.format("term-ref", {}, errs);
      assert.equal(val, "Bar");
      assert.equal(errs.length, 0);
    });

    test("terms can be parameterized", function() {
      const val = bundle.format("term-call", {}, errs);
      assert.equal(val, "Bar");
      assert.equal(errs.length, 0);
    });
  });

  suite("Passing arguments", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
      });
      bundle.addMessages(ftl`
        -foo = Foo {$arg}

        ref-foo = {-foo}
        call-foo-no-args = {-foo()}
        call-foo-with-expected-arg = {-foo(arg: 1)}
        call-foo-with-other-arg = {-foo(other: 3)}
      `);
    });

    test("Not parameterized, no externals", function() {
      const val = bundle.format("ref-foo", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("Not parameterized but with externals", function() {
      const val = bundle.format("ref-foo", {arg: 1}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no externals", function() {
      const val = bundle.format("call-foo-no-args", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, but with externals", function() {
      const val = bundle.format("call-foo-no-args", {arg: 1}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With expected args, no externals", function() {
      const val = bundle.format("call-foo-with-expected-arg", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With expected args, and with externals", function() {
      const val = bundle.format("call-foo-with-expected-arg", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With other args, no externals", function() {
      const val = bundle.format("call-foo-with-other-arg", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With other args, and with externals", function() {
      const val = bundle.format("call-foo-with-other-arg", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });
  });

  suite("Nesting message references", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
      });
      bundle.addMessages(ftl`
        foo = Foo {$arg}
        -bar = {foo}
        ref-bar = {-bar}
        call-bar = {-bar()}
        call-bar-with-arg = {-bar(arg: 1)}
      `);
    });

    test("No parameterization, no externals", function() {
      const val = bundle.format("ref-bar", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, but with externals", function() {
      const val = bundle.format("ref-bar", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no externals", function() {
      const val = bundle.format("call-bar", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, but with externals", function() {
      const val = bundle.format("call-bar", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With arguments, no externals", function() {
      const val = bundle.format("call-bar-with-arg", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);

    });
    test("With arguments and with externals", function() {
      const val = bundle.format("call-bar-with-arg", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });
  });

  suite("Nesting term references", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
      });
      bundle.addMessages(ftl`
        -foo = Foo {$arg}
        -bar = {-foo}
        -baz = {-foo()}
        -qux = {-foo(arg: 1)}

        ref-bar = {-bar}
        ref-baz = {-baz}
        ref-qux = {-qux}

        call-bar-no-args = {-bar()}
        call-baz-no-args = {-baz()}
        call-qux-no-args = {-qux()}

        call-bar-with-arg = {-bar(arg: 2)}
        call-baz-with-arg = {-baz(arg: 2)}
        call-qux-with-arg = {-qux(arg: 2)}
        call-qux-with-other = {-qux(other: 3)}
      `);
    });

    test("No parameterization, no parameterization, no externals", function() {
      const val = bundle.format("ref-bar", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, no parameterization, with externals", function() {
      const val = bundle.format("ref-bar", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, no arguments, no externals", function() {
      const val = bundle.format("ref-baz", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, no arguments, with externals", function() {
      const val = bundle.format("ref-baz", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, with arguments, no externals", function() {
      const val = bundle.format("ref-qux", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("No parameterization, with arguments, with externals", function() {
      const val = bundle.format("ref-qux", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no parameterization, no externals", function() {
      const val = bundle.format("call-bar-no-args", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no parameterization, with externals", function() {
      const val = bundle.format("call-bar-no-args", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no arguments, no externals", function() {
      const val = bundle.format("call-baz-no-args", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no arguments, with externals", function() {
      const val = bundle.format("call-baz-no-args", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("No arguments, with arguments, no externals", function() {
      const val = bundle.format("call-qux-no-args", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("No arguments, with arguments, with externals", function() {
      const val = bundle.format("call-qux-no-args", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With arguments, no parameterization, no externals", function() {
      const val = bundle.format("call-bar-with-arg", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With arguments, no parameterization, with externals", function() {
      const val = bundle.format("call-bar-with-arg", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With arguments, no arguments, no externals", function() {
      const val = bundle.format("call-baz-with-arg", {}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With arguments, no arguments, with externals", function() {
      const val = bundle.format("call-baz-with-arg", {arg: 5}, errs);
      assert.equal(val, "Foo $arg");
      assert.equal(errs.length, 0);
    });

    test("With arguments, with arguments, no externals", function() {
      const val = bundle.format("call-qux-with-arg", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With arguments, with arguments, with externals", function() {
      const val = bundle.format("call-qux-with-arg", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With unexpected arguments, with arguments, no externals", function() {
      const val = bundle.format("call-qux-with-other", {}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });

    test("With unexpected arguments, with arguments, with externals", function() {
      const val = bundle.format("call-qux-with-other", {arg: 5}, errs);
      assert.equal(val, "Foo 1");
      assert.equal(errs.length, 0);
    });
  });

  suite("Parameterized term attributes", function(){
    suiteSetup(function() {
      bundle = new FluentBundle("en-US", {
        useIsolating: false,
      });
      bundle.addMessages(ftl`
        -ship = Ship
            .gender = {$style ->
               *[traditional] neuter
                [chicago] feminine
            }

        ref-attr = {-ship.gender ->
           *[masculine] He
            [feminine] She
            [neuter] It
        }
        call-attr-no-args = {-ship.gender() ->
           *[masculine] He
            [feminine] She
            [neuter] It
        }
        call-attr-with-expected-arg = {-ship.gender(style: "chicago") ->
           *[masculine] He
            [feminine] She
            [neuter] It
        }
        call-attr-with-other-arg = {-ship.gender(other: 3) ->
           *[masculine] He
            [feminine] She
            [neuter] It
        }
      `);
    });

    test("Not parameterized, no externals", function() {
      const val = bundle.format("ref-attr", {}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });

    test("Not parameterized but with externals", function() {
      const val = bundle.format("ref-attr", {style: "chicago"}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });

    test("No arguments, no externals", function() {
      const val = bundle.format("call-attr-no-args", {}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });

    test("No arguments, but with externals", function() {
      const val = bundle.format("call-attr-no-args", {style: "chicago"}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });

    test("With expected args, no externals", function() {
      const val = bundle.format("call-attr-with-expected-arg", {}, errs);
      assert.equal(val, "She");
      assert.equal(errs.length, 0);
    });

    test("With expected args, and with externals", function() {
      const val = bundle.format("call-attr-with-expected-arg", {style: "chicago"}, errs);
      assert.equal(val, "She");
      assert.equal(errs.length, 0);
    });

    test("With other args, no externals", function() {
      const val = bundle.format("call-attr-with-other-arg", {}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });

    test("With other args, and with externals", function() {
      const val = bundle.format("call-attr-with-other-arg", {style: "chicago"}, errs);
      assert.equal(val, "It");
      assert.equal(errs.length, 0);
    });
  });
});
