// key1 = {{ foo }}

// key2 = {  { foo }  }

// key3 =
//   {
//     { foo }
//   }

key4 = {  { foo }
//~ ERROR E0014, pos 96


// key5 = { foo } }
