key1 = {{ foo }}

key2 = {  { foo }  }

# key3 =
#   {
#     { foo }
#   }

# ~ERROR E0003, pos 96, args "}"
key4 = {  { foo }


# ~ERROR E0027, pos 111
key5 = { foo } }
