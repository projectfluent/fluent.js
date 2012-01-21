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
  'name_input': function() {
    var nameInput = document.querySelectorAll('[l10n-id="name_input"]')[0];
    assertEquals(nameInput.getAttribute('title'), 'You can give us your nickname if you prefer');
    assertEquals(nameInput.getAttribute('placeholder'), 'Write your name');
  },
  'phone_input': function() {
    var phoneInput = document.querySelectorAll('[l10n-id="phone_input"]')[0];
    assertEquals(phoneInput.getAttribute('placeholder'), '(501) 650 231 800');
  },
  'address_input': function() {
    var addressInput = document.querySelectorAll('[l10n-id="address_input"]')[0];
    assertEquals(addressInput.getAttribute('placeholder'), '650 Castro St., Suite 300, MtV, CA');
  },
}

