  key1 = A
#~ ERROR E0002, pos 0

key2 = {
a }
#~ ERROR E0014, pos 20
#~ ERROR E0003, pos 23, args "="

key3 = { a
}
#~ ERROR E0003, pos 36, args "}"

key4 = {
{ a }}
#~ ERROR E0014, pos 48
