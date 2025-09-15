For an automaton to accept is input, in addition to the current state being 
accepting, there must be no more input remaining.

## Regular expressions
When representing the languages NFAs can recognise, it is often convenient
to use **regular expressions**. A regular expression can be
constructed in the following ways:
* A symbol (e.g. `a`), which recognises only exactly that symbol.
* An `ε` which recognises the empty string.
* A `∅` which recognises nothing.
* `R*` with `R` being a regular expression recognising any word that can be 
  broken up into zero or more (potentially different) words all recognised 
  by `R`.
* `RS` with `R` and `S` being regular expressions recognising all words which 
  start with something recognised by `R` and end with something recognised 
  by `S`.
* `R + S` with `R` and `S` being regular expressions recognising either 
  something recognised by `R` or something recognised by `S`.
* `(R)` where `R` is a regular expression recognising exactly what `R` 
  recognises.

<details markdown>
    <summary>Language</summary>
    This automaton accepts the language recognised by:

```text
aa + aaa
```
</details>