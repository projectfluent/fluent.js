// key1 = {{ foo }}

// key2 = {  { foo }  }

// key3 =
//   {
//     { foo }
//   }

key4 = {  { foo }
//~ ERROR E0004, pos 96, args "a-zA-Z_"


// key5 = { foo } }
