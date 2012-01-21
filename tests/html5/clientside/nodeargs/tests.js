var utests = {
  'name': function() {
    var name = document.querySelectorAll('[l10n-id="name"]')[0];
    assertEquals(name.textContent, 'Name');
  },
  'window_title': function() {
    var windowTitle = document.querySelectorAll('[l10n-id="window_title"]')[0];
    assertEquals(windowTitle.textContent, 'Downloading 5 files');
  },
  'name_input': function() {
    var nameInput = document.querySelectorAll('[l10n-id="name_input"]')[0];
    assertEquals(nameInput.getAttribute('value'), "Maggie");
    assertEquals(nameInput.getAttribute('placeholder'), "Write your name Maggie");
    assertEquals(nameInput.getAttribute('title'), "You can give us your nickname if you prefer");
  },
  'download_status': function() {
    var span = document.querySelectorAll('[l10n-id="download_status"]')[0];
    assertEquals(span.textContent, 'Mark is currently downloading 5 files.');
  },
  'mood': function() {
    var span = document.querySelectorAll('[l10n-id="mood"]')[0];
    assertEquals(span.textContent, "He's happy!");
  },
}



