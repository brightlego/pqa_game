Finding the regular expression that recognises the language of this level is 
much more challenging than in the previous levels, so don't worry if you 
can't get it. It took me three pages of working and about 1 hour to find the 
regular expression.

There are several possible algorithms one can use to convert an NFA into a 
regular expression. One of them is [Kleene's algorithm](https://en.wikipedia.org/wiki/Kleene%27s_algorithm) 
(note Wikipedia uses `R1 | R2` instead of `R1 + R2`). 

Additionally, to simplify some regular expressions, `R?` is a shorthand for `
(R + ε)` where `R` is a regular expression.

<details markdown>
    <summary>Language</summary>
    This automaton accepts the language recognised by:

```text
1(
    (000?1?)*00?(01)? 
    + (00 + 01(1 + (000?1?)*000?11?)?0)*
      0(1((000?1?)*00?(01)?)?)?
)2
```

Don't worry if you got something different. I didn't use Kleene's 
 algorithm, and there are many possible answers, so you're probably correct. 
</details>