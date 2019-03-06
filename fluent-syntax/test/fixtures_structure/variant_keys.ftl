key01 = { $sel ->
    *[
        key
    ] Value
}

key02 = { $sel ->
    *[
        key
    ]
    
    Value
}

err01 = { $sel ->
    *["key"] Value
}

err02 = { $sel ->
    *[-key] Value
}

err03 = { $sel ->
    *[-key.attr] Value
}

err04 = { $sel ->
    *[-key()] Value
}

err05 = { $sel ->
    *[-key.attr()] Value
}

err06 = { $sel ->
    *[key.attr] Value
}

err07 = { $sel ->
    *[$key] Value
}

err08 = { $sel ->
    *[FUNC()] Value
}

err09 = { $sel ->
    *[{key}] Value
}

err10 = { $sel ->
    *[{"key"}] Value
}

err11 = { $sel ->
    *[{3.14}] Value
}

err12 = { $sel ->
    *[{$key}] Value
}
