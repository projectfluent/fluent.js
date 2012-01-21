var utests = {
  'retranslate': function() {
    var button = document.getElementsByTagName('button')[0];
    button.click();
    var mood = document.querySelectorAll('[l10n-id="mood"]')[0];
    assertEquals(mood.textContent, "She's happy!");
    mood.innerHTML = "He's happy!";
  },
}
