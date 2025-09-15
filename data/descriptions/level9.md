Finding the regular expression that recognises the language of this level is 
much more challenging than in the previous levels, so don't worry if you 
can't get it. It took me three pages of working and about 1 hour to find the 
regular expression.

If you are interested in learning about an algorithm to convert an NFA into 
a regular expression, look at
[Kleene's algorithm](https://en.wikipedia.org/wiki/Kleene%27s_algorithm) 
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
<!--
A = (000?1?)*
B' = 01?0 + 01A000?10 + 01(1 + A000?11)?0
   = 00 + 010 + 01A000?10 + 010 + 0110 + 01A000?110
   = 00 + 01(1 + A000?1 + A000?11)?0
   = 00 + 01(1 + A000?11?)?0
   = 00 + 01(1 + (000?1?)*000?11?)?0
B = (B')* = (00 + 01(1 + (000?1?)*000?11?)?0)*


1B(01?2 + 01A00?(01)?2) + 1A00?(01)?2
1B01?2 + 1B01A00?(01)?2 + 1A00?(01)?2
C = A00?(01)? = (000?1?)*00?(01)?
1B01?2 + 1B01C2 + 1C2
1B02 + 1B012 + 1B01C2 + 1C2
1(B0 + B01 + B01C + C)2
1(C + B0(1 + 1C)?)2
1(C + B0(1C?)?)2
1((000?1?)*00?(01)? + (00 + 01(1 + (000?1?)*000?11?)?0)*0(1((000?1?)*00?(01)?)?)?)2

1(
    (000?1?)*00?(01)? 
    + (00 + 01(1 + (000?1?)*000?11?)?0)*
      0(1((000?1?)*00?(01)?)?)?
)2


1(B01? + B01C + C)2
1(C + B0(1C + 1?))2

1(
    (000?1?)*00?(01)?
    + (00 + 01(1 + (000?1?)*000?11?)?0)*0
      (1 + (000?1?)*00?(01)?)
)2
-->
