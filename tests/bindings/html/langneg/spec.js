describe("Localization", function() {
  it("name should be 'Name'", function() {
    var name = document.querySelector('[data-l10n-id="name"]');
    var l10n = {
      'en-US': 'Name',
      'pl': "Imię"
    }
    var locale = document.l10nCtx.settings.locales[0];
    expect(name.textContent).toEqual(l10n[locale]);
  });
  it("phone should be 'Phone'", function() {
    var phone = document.querySelector('[data-l10n-id="phone"]');
    var l10n = {
      'en-US': 'Phone',
      'pl': "Telefon"
    }
    var locale = document.l10nCtx.settings.locales[0];
    expect(phone.textContent).toEqual(l10n[locale]);
  });
  it("address should be 'Address'", function() {
    var address = document.querySelector('[data-l10n-id="address"]');
    var l10n = {
      'en-US': 'Address',
      'pl': "Adres"
    }
    var locale = document.l10nCtx.settings.locales[0];
    expect(address.textContent).toEqual(l10n[locale]);
  });
});
