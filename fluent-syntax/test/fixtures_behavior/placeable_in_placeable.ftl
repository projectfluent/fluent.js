key1 = {{ foo }}

key2 = {  { foo }  }

# key3 =
#   {
#     { foo }
#   }

key4 = {  { foo }
# ~ERROR E0003, pos 96, args "}"


key5 = { foo } }
