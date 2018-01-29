-brand-short-name = Firefox
    .gender = masculine

key = Test { -brand-short-name }

key2 =
    Test { -brand-short-name.gender ->
        [masculine] Foo
       *[feminine] Foo 2
    }

key3 = Test { -brand-short-name[accusative] }

err1 =
    { $foo ->
        [one] Foo
       *[-other] Foo 2
    }
//~ ERROR E0004, pos 285, args "0-9"

err2 = { $-foo }
//~ ERROR E0004, pos 315, args "a-zA-Z"

err4 = { -brand() }
//~ ERROR E0008, pos 340

-err5 =
//~ ERROR E0006, pos 351, args "-err5"

-err6 =
    .attr = Attribute
//~ ERROR E0006, pos 360, args "-err6"
