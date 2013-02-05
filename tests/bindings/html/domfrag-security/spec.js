describe("Translation", function() {
  it("should read: This is a harmless link.", function() {
    var node = document.querySelector('#message');
    expect(node.textContent).toEqual('This is a harmless link.');
  });
});
describe("The link", function() {
  it("should not have an id attribute", function() {
    var node = document.querySelector('#message a');
    expect(node.id).toEqual('');
  });
  it("should not have an onclick event", function() {
    var node = document.querySelector('#message a');
    expect(node.onclick).toBeNull();
  });
  it("should not have an onclick attribute", function() {
    var node = document.querySelector('#message a');
    expect(node.getAttribute('onclick')).toBeNull();
  });
  it("its onclick handler should not be alert('Boo!');", function() {
    var node = document.querySelector('#message a');
    expect(node.getAttribute('onclick')).not.toEqual("alert('Boo!');");
  });
});
