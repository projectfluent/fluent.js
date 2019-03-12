-brand-short-name = Firefox
    .gender = masculine

key = Test { -brand-short-name }

key2 =
    Test { -brand-short-name.gender ->
        [masculine] Foo
       *[feminine] Foo 2
    }

key4 = { -brand() }

# ~ERROR E0004, pos 259, args "0-9"
err1 =
    { $foo ->
        [one] Foo
       *[-other] Foo 2
    }

# ~ERROR E0004, pos 289, args "a-zA-Z"
err2 = { $-foo }

# ~ERROR E0006, pos 304, args "err5"
-err5 =

# ~ERROR E0006, pos 313, args "err6"
-err6 =
    .attr = Attribute
