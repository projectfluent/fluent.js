import assert from "assert";
import { Locale } from "../esm/locale.js";

function isLocaleEqual(str, ref) {
  const locale = new Locale(str);
  return (
    locale.language === ref.language &&
    locale.script === ref.script &&
    locale.region === ref.region &&
    locale.variant === ref.variant
  );
}

suite("Parses simple locales", () => {
  test("language part", () => {
    assert.ok(
      isLocaleEqual("en", {
        language: "en",
      })
    );

    assert.ok(
      isLocaleEqual("lij", {
        language: "lij",
      })
    );
  });

  test("script part", () => {
    assert.ok(
      isLocaleEqual("en-Latn", {
        language: "en",
        script: "Latn",
      })
    );

    assert.ok(
      isLocaleEqual("lij-Arab", {
        language: "lij",
        script: "Arab",
      })
    );
  });

  test("region part", () => {
    assert.ok(
      isLocaleEqual("en-Latn-US", {
        language: "en",
        script: "Latn",
        region: "US",
      })
    );

    assert.ok(
      isLocaleEqual("lij-Arab-FA", {
        language: "lij",
        script: "Arab",
        region: "FA",
      })
    );
  });

  test("variant part", () => {
    assert.ok(
      isLocaleEqual("en-Latn-US-macos", {
        language: "en",
        script: "Latn",
        region: "US",
        variant: "macos",
      })
    );

    assert.ok(
      isLocaleEqual("lij-Arab-FA-linux", {
        language: "lij",
        script: "Arab",
        region: "FA",
        variant: "linux",
      })
    );
  });

  test("skipping script part", () => {
    assert.ok(
      isLocaleEqual("en-US", {
        language: "en",
        region: "US",
      })
    );

    assert.ok(
      isLocaleEqual("lij-FA-linux", {
        language: "lij",
        region: "FA",
        variant: "linux",
      })
    );
  });

  test("skipping variant part", () => {
    assert.ok(
      isLocaleEqual("en-US", {
        language: "en",
        region: "US",
      })
    );

    assert.ok(
      isLocaleEqual("lij-FA-linux", {
        language: "lij",
        region: "FA",
        variant: "linux",
      })
    );
  });

  test("skipping extensions", () => {
    assert.ok(
      isLocaleEqual("en-US-macos-linux-u-hc-h12", {
        language: "en",
        region: "US",
        variant: "macos-linux",
      })
    );
  });
});

suite("Parses locale ranges", () => {
  test("language part", () => {
    assert.ok(
      isLocaleEqual("*", {
        language: "und",
      })
    );

    assert.ok(
      isLocaleEqual("*-Latn", {
        language: "und",
        script: "Latn",
      })
    );

    assert.ok(
      isLocaleEqual("*-US", {
        language: "und",
        region: "US",
      })
    );
  });

  test("script part", () => {
    assert.ok(
      isLocaleEqual("en-*", {
        language: "en",
      })
    );

    assert.ok(
      isLocaleEqual("en-*-US", {
        language: "en",
        region: "US",
      })
    );
  });

  test("region part", () => {
    assert.ok(
      isLocaleEqual("en-Latn-*", {
        language: "en",
        script: "Latn",
      })
    );
  });

  test("variant part", () => {
    assert.ok(
      isLocaleEqual("en-Latn-US-*", {
        language: "en",
        script: "Latn",
        region: "US",
      })
    );
  });
});
