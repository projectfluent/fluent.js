  key1 = A
//~ ERROR E0002, pos 0

key2 = {
a }
//~ ERROR E0004, pos 20, args "a-zA-Z_"
//~ ERROR E0005, pos 23, args "a"

key3 = { a
}
//~ ERROR E0003, pos 36, args "}"

key4 = {
{ a }}
//~ ERROR E0004, pos 48, args "a-zA-Z_"
