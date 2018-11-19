key01 = Value
    Continued here.

key02 =
    Value
    Continued here.

# ERROR "Continued" looks like a new message.
# key03 parses fine with just "Value".
key03 =
    Value
Continued here
    and here.

# ERROR "Continued" and "and" look like new messages
# key04 parses fine with just "Value".
key04 =
    Value
Continued here
and even here.
