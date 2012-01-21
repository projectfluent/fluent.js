var utests = {
  'test': function() {
    function test() {
      var node = document.querySelectorAll('[l10n-id="test"]')[0];
      assertEquals(getEntity('test'), node.textContent); 
    }
  },
}


