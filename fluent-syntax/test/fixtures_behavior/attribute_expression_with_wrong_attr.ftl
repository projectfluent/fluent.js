key = { foo.23 }

//~ ERROR E0004, pos 12, args "a-zA-Z_"

key = { foo. }

//~ ERROR E0004, pos 31, args "a-zA-Z_"
