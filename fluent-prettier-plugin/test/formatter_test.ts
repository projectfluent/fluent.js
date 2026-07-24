import ftl from "@fluent/dedent";
import fluentPrettierPlugin from "@fluent/prettier-plugin";
import * as prettier from "prettier";

async function format(source: string): Promise<string> {
  return await prettier.format(source, {
    parser: "fluent",
    plugins: [fluentPrettierPlugin],
    checkIgnorePragma: true,
  });
}

test("normalizes whitespace", async () => {
  const input = ftl`
    -brand-name = Some brand
    example= This is an example.


    welcome =

        Welcome, {$name}, to {    -brand-name    }!

    `;
  const expected = ftl`
    -brand-name = Some brand
    example = This is an example.
    welcome = Welcome, { $name }, to { -brand-name }!

    `;
  await expect(format(input)).resolves.toBe(expected);
});

test("handles multiline text", async () => {
  // based on https://projectfluent.org/fluent/guide/text.html
  const input = ftl`
    multi = Text can also span multiple lines as long as
            each new line is indented by at least one space.
            Because all lines in this message are indented
            by the same amount, all indentation will be
            removed from the final value.

    with-indents =
        Indentation common to all indented lines is removed
        from the final text value.
          This line has 2 spaces in front of it.

    `;
  const expected = ftl`
    multi =
        Text can also span multiple lines as long as
        each new line is indented by at least one space.
        Because all lines in this message are indented
        by the same amount, all indentation will be
        removed from the final value.
    with-indents =
        Indentation common to all indented lines is removed
        from the final text value.
          This line has 2 spaces in front of it.

    `;
  await expect(format(input)).resolves.toBe(expected);
});

test("sorts messages and terms", async () => {
  const input = ftl`
    foo = Foo
    -example-term = Example term
    z = Zzz
    UPPER = Uppercase identifier
    bar = Bar

    `;
  const expected = ftl`
    bar = Bar
    -example-term = Example term
    foo = Foo
    UPPER = Uppercase identifier
    z = Zzz

    `;
  await expect(format(input)).resolves.toBe(expected);
});

test("formats functions, selectors, placeables, and attributes", async () => {
  const input = ftl`
    last-notice =
       Last checked: { DATETIME(
         $lastChecked,
           day:"numeric",month: "long"
           ) }.
    message-count = {$count ->
      [one] { $count } message
      *[other] { $count } messages
    }
    user =
      .label=Example label
      .placeholder =    hello, {
           $name
        }

    `;
  const expected = ftl`
    last-notice = Last checked: { DATETIME($lastChecked, day: "numeric", month: "long") }.
    message-count =
        { $count ->
            [one] { $count } message
           *[other] { $count } messages
        }
    user =
        .label = Example label
        .placeholder = hello, { $name }

    `;
  await expect(format(input)).resolves.toBe(expected);
});

test("keeps bound comments with the associated message", async () => {
  const input = ftl`
    # comment about beta
    beta = Beta
    alpha = Alpha

    `;
  await expect(format(input)).resolves.toBe(ftl`
    alpha = Alpha
    # comment about beta
    beta = Beta

    `);
});

test("leaves stand-alone comments intact and uses them as sorting boundary", async () => {
  const input = ftl`
    ### file comment
    beta = Beta
    alpha = Alpha
    ## section 1
    greeting = Hello
    another-greeting = Hi


    ## section 2
    ## formatting stays intact, e.g. multiple    spaces

    message = Example message
    another-message = Another example message

    `;
  const expected = ftl`
    ### file comment

    alpha = Alpha
    beta = Beta

    ## section 1

    another-greeting = Hi
    greeting = Hello

    ## section 2
    ## formatting stays intact, e.g. multiple    spaces

    another-message = Another example message
    message = Example message

    `;
  await expect(format(input)).resolves.toBe(expected);
});

test("respects ignore pragma comments", async () => {
  const input = ftl`
    # @noformat
    foo=foo
    bar=bar

    `;
  await expect(format(input)).resolves.toBe(input);
});

test("fails on invalid syntax", async () => {
  const input = ftl`
    invalid

    `;
  await expect(format(input)).rejects.toThrow(
    'E0003: Expected token: "=" (1:8)'
  );
});
