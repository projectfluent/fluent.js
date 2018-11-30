# ERROR No blanks are allowed between * and [.
err01 = { $sel ->
    *  [key] Value
}

# ERROR Missing default variant.
err02 = { $sel ->
    [key] Value
}
