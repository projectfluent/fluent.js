key = { -2.4.5 }
# ~ERROR E0003, pos 12, args "}"

key = { -2.4. }
# ~ERROR E0003, pos 30, args "}"

key = { -.4 }
# ~ERROR E0004, pos 44, args "a-zA-Z"

key = { -2..4 }
# ~ERROR E0004, pos 61, args "0-9"

key = { 24d }
# ~ERROR E0003, pos 77, args "}"
