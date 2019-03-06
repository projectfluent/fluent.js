err1 =
    { foo[bar] ->
       *[1] One
        [2] Two
    }
# ~ERROR E0003, pos 16, args "}"

err2 =
    { -foo[bar] ->
       *[1] One
        [2] Two
    }
# ~ERROR E0017, pos 87
