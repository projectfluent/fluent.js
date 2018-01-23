err1 =
    { foo[bar] ->
       *[1] One
        [2] Two
    }
//~ ERROR E0017, pos 22

err2 =
    { -foo[bar] ->
       *[1] One
        [2] Two
    }
//~ ERROR E0017, pos 87
