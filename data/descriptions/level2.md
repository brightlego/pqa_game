Most automata read in a **word** (a sequence of symbols) from the input. 
Words are read from the front back. The word, in this case `ab`, can be 
found below the automaton.

Each transition reads in either nothing or a single symbol from the input. 
The symbol *must* be at the front of the input for the transition to be able 
to be run. 

In this case, the transition from `q0` to `q1` reads in an `a` from the 
input. Try clicking on that transition. 

As an additional challenge, try thinking about what possible words each 
automaton can accept, called the **language** of the automaton. The answers 
will be hidden at the bottom of the description under "Language".

<details markdown>
    <summary>Language</summary>
    This automaton accepts only the word `ab`.
</details>