In many automata, there are loops which can allow the automata to accept 
infinitely many words. In this case, you need to go through the 
`q0`-`q1`-`q0` loop to accept the input. 

When representing the languages NFAs can recognise, it is often convenient 
to use **regular expressions** (or **regex**). A regular expression can be 
constructed in the following ways:
 * A symbol (e.g. `a`), which recognises only exactly that symbol.
 * An `ε` which recognises the empty string.
 * A `∅` which recognises nothing.
 * `R*` with `R` being a regex recognising any word that can be broken up 
   into zero or more (potentially different) words all recognised by `R`.
 * `RS` with `R` and `S` being regexes recognising all words which start 
   with something recognised by `R` and end with something recognised by `S`.
 * `R + S` with `R` and `S` being regexes recognising either something 
   recognised by `R` or something recognised by `S`.
 * `(R)` where `R` is a regex recognising exactly what `R` recognises.

<details markdown>
    <summary>Language</summary>
    This automaton accepts the language recognised by `(ab)*a`
</details>