beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation((...messages) => {
    throw new Error(
      [
        'Unexpected console.warn() in a test run. Add a jest.spyOn(console, "warn")',
        "line to the test if this console.warn is actually expected.",
        "",
        "console.warn message:",
        ...messages,
      ].join("\n")
    );
  });
});
