var utests = {
  'name': function() {
    var name = document.querySelectorAll('[l10n-id="name"]')[0];
    assertEquals(name.textContent, 'Name');
  },
  'phone': function() {
    var phone = document.querySelectorAll('[l10n-id="phone"]')[0];
    assertEquals(phone.textContent, 'Phone');
  },
  'address': function() {
    var address = document.querySelectorAll('[l10n-id="address"]')[0];
    assertEquals(address.textContent, 'Address');
  },
}
