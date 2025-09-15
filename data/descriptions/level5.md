In many automata, there are loops which can allow the automata to accept 
infinitely many words. In this case, you need to go through the 
`q0`-`q1`-`q0` loop to accept the input. 



<details markdown>
    <summary>Language</summary>
    This automaton accepts the language recognised by:

```text
(ab)*a
```
</details>