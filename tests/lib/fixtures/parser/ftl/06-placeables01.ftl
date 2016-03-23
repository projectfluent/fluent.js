key1 = AA { $num } BB

key2 = { brand-name }

key3 = { menu/open }

key4 = { $num ->
  [one] One
  [two] Two
}

key5 = { LEN($num) ->
  [one] One
  [two] Two
}

key6 = { LEN(NEL($num)) ->
  [one] One
  [two] Two
}

key7 = { $user1, $user2 }

key8 = { LEN($u1, $u2, open/brand-name, type="short") }

key9 = { LEN(2, 2.5, -3.12, -1.00) }

key10 = { menu/brand-name[accusative] }

