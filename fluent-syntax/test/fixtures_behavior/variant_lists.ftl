# ~ERROR E0014, pos 25
message1 =
    {
        *[one] One
    }

# ~ERROR E0014, pos 97
message2 =
    { $sel ->
        *[one] {
            *[two] Two
         }
    }

-term1 =
    {
        *[one] One
    }

-term2 =
    {
        *[one] {
            *[two] Two
         }
    }

# ~ERROR E0014, pos 292
-term3 =
    { $sel ->
        *[one] {
            *[one] Foo
         }
    }
