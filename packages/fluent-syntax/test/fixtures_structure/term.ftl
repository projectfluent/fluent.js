-brand-name =
    {
       *[nominative] Firefox
        [accusative] Firefoxa
    }
    .gender = masculine

update-command =
    Zaktualizuj { -brand-name[accusative] }.

update-successful =
    { -brand-name.gender ->
        [masculine] { -brand-name } został pomyślnie zaktualizowany.
        [feminine] { -brand-name } została pomyślnie zaktualizowana.
       *[other] Program { -brand-name } został pomyślnie zaktualizowany.
    }
