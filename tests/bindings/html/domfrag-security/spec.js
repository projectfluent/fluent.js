describe('Translation', function() {
  'use strict';
  it('should read: This is a harmless link.', function() {
    var node = document.querySelector('#message');
    expect(node.textContent.trim()).toEqual('This is a harmless link. It will not alert anything.');
  });
});
describe('The link', function() {
  'use strict';
  it('should not have an id attribute', function() {
    var node = document.querySelector('#message a');
    expect(node.id).toEqual('');
  });
  it('should not have an onclick event', function() {
    var node = document.querySelector('#message a');
    expect(node.onclick).toBeNull();
  });
  it('should not have an onclick attribute', function() {
    var node = document.querySelector('#message a');
    expect(node.getAttribute('onclick')).toBeNull();
  });
  it('its onclick handler should not be alert("Hello");', function() {
    var node = document.querySelector('#message a');
    expect(node.getAttribute('onclick')).not.toEqual('alert("Hello");');
  });
});
