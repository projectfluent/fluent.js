#~ ERROR E0014, pos 16
message1 =
    {
        *[one] One
    }

#~ ERROR E0014, pos 59
message2 =
    {
        *[one] {
            *[two] Two
         }
    }

#~ ERROR E0023, pos 193
message3 =
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

#~ ERROR E0023, pos 388
-term3 =
    { $sel ->
        *[one] {
            *[one] Foo
         }
    }
