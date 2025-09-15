In the centre, there is the **automaton**. The automaton is made up of potential
**states**, represented by circles, and **transitions** between those states, 
represented by arrows. The **current** state is the state in yellow, and the 
**accepting** states have double borders. 

For now, we will only deal with NFAs (Nondeterministic Finite Automata) 
which only have these states and transitions. However, later on we will 
introduce PQAs which have a priority queue as well.

The goal of this game is to make the automaton accept by making an accepting 
state the current state.

Try clicking on the transition to move the current state from `q0` to `q1`.