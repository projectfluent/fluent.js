-term =
    { $case ->
       *[uppercase] Term
        [lowercase] term
    }
    .attr = a

key01 = {-term}
key02 = {-term()}
key03 = {-term(case: "uppercase")}


key04 =
    { -term.attr ->
        [a] { -term } A
        [b] { -term() } B
       *[x] X
    }

-err1 =
-err2 =
    .attr = Attribute
--err3 = Error
err4 = { --err4 }
