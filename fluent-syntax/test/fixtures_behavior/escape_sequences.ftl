## Backslash is a regular character in text elements.
key01 = \A
key02 = \u0041
key03 = \\u0041
key04 = \u000z
key05 = \{Value}

key06 = {"Escaped \" quote"}
key07 = {"Escaped \\ backslash"}
key08 = {"Escaped \u0041 A"}

# ~ERROR E0025, pos 232, args "A"
key09 = {"\A"}

# ~ERROR E0026, pos 252, args "000z"
key10 = {"\u000z"}
