// a finite number of priorities is implied by a finite number of transitions
type PQAInternal = {
    stateCount: number;
    inputAlphabetCount: number;
    queueAlphabetCount: number;
    initialState: StateIdx;
    acceptingStates: Set<StateIdx>;
    transitionCount: number;
    transitions: TransitionInternal[]
}

type InputIdx = number
type QueueIdx = number
type PriorityIdx = number
type StateIdx = number
type TransitionIdx = number

type QueueElement = { queueSymbol: QueueIdx, priority: PriorityIdx }

export type Transition<State, Input, Queue> = {
    stateFrom: State;
    stateTo: State;
    input: null | Input;
    queueOut: null | { queueSymbol: Queue, priority: number };
    queueIn: null | { queueSymbol: Queue, priority: number };
}

type TransitionInternal = Transition<StateIdx, InputIdx, QueueIdx>

class RunState {
    maxPriority: PriorityIdx;
    queue: Map<PriorityIdx, Map<QueueIdx, number>>;
    state: StateIdx;
    word: number[];
    automaton: PQAInternal;

    constructor(automaton: PQAInternal, word: number[]) {
        this.maxPriority = -Infinity;
        this.queue = new Map();
        this.state = automaton.initialState;
        this.automaton = automaton;
        this.word = word;
    }

    updateMaxPriority() {
        this.maxPriority = Math.max(...this.queue.keys())
    }

    tryRemoveElement(elem: QueueElement): boolean {
        if (elem.priority < this.maxPriority) { return false; }
        let map = this.queue.get(elem.priority);
        if (map === undefined) { return false; }
        let count = map.get(elem.queueSymbol);
        if (count === undefined || count === 0) { return false; }
        map.set(elem.queueSymbol, count - 1);
        if (count === 1) {
            this.updateMaxPriority()
        }
        return true;
    }

    addElement(elem: QueueElement) {
        let map = this.queue.get(elem.priority);
        if (map === undefined) {
            map = new Map();
            this.queue.set(elem.priority, map);
        }
        let count = map.get(elem.queueSymbol);
        if (count === undefined) {
            count = 0;
        }
        if (elem.priority > this.maxPriority) {
            this.maxPriority = elem.priority;
        }
        map.set(elem.queueSymbol, count + 1);
    }

    public tryRunTransition(transitionIdx: TransitionIdx): boolean {
        let transition = this.automaton.transitions[transitionIdx];
        if (transition.stateFrom !== this.state) { return false; }
        if (transition.input !== null && this.word.length > 0 && transition.input != this.word[this.word.length - 1]) { return false; }
        if (transition.queueOut !== null && !this.tryRemoveElement(transition.queueOut)) { return false; }
        if (transition.input !== null) { this.word.pop(); }
        this.state = transition.stateTo;
        if (transition.queueIn !== null) { this.addElement(transition.queueIn); }
        return true;
    }

    public canAccept(): boolean {
        return this.word.length === 0 && this.automaton.acceptingStates.has(this.state);
    }
}


// noinspection NonAsciiCharacters
export class PQARun<Q, Σ, Γ> {
    runState: RunState;
    states: Q[];
    inputSymbols: Σ[];
    queueSymbols: Γ[];

    constructor(states: Q[], inputSymbols: Σ[], queueSymbols: Γ[], initialState: Q, acceptingStates: Set<Q>, transitions: Transition<Q, Σ, Γ>[], word: Σ[]) {
        this.states = states;
        this.inputSymbols = inputSymbols;
        this.queueSymbols = queueSymbols;

        let stateLookup = new Map<Q, StateIdx>()
        for (let i = 0; i < states.length; i++) { stateLookup.set(states[i], i); }

        let inputLookup = new Map<Σ, StateIdx>()
        for (let i = 0; i < inputSymbols.length; i++) { inputLookup.set(inputSymbols[i], i); }

        let queueLookup = new Map<Γ, StateIdx>()
        for (let i = 0; i < queueSymbols.length; i++) { queueLookup.set(queueSymbols[i], i); }

        if (!stateLookup.has(initialState)) { throw new Error(`Initial state ${initialState} not found in states`); }

        let acceptingStateIdx = new Set<StateIdx>()
        for (let state of acceptingStates) {
            let res = stateLookup.get(state);
            if (res !== undefined) { acceptingStateIdx.add(res); }
            else { throw new Error(`Accepting state ${state} not found in states`)}
        }

        let transitionsIdxs: TransitionInternal[] = [];
        for (let transition of transitions) {
            let input: InputIdx | null, queueIn: QueueElement | null, queueOut: QueueElement | null, stateFrom: StateIdx, stateTo: StateIdx;
            if (transition.input === null) { input = null; } else {
                let res = inputLookup.get(transition.input);
                if (res === undefined) { throw new Error(`Input ${transition.input} not found in input alphabet`); }
                input = res;
            }
            if (transition.queueIn === null) { queueIn = null; } else {
                let res = queueLookup.get(transition.queueIn.queueSymbol);
                if (res === undefined) { throw new Error(`Queue symbol ${transition.queueIn.queueSymbol} not found in input alphabet`); }
                queueIn = {queueSymbol: res, priority: transition.queueIn.priority};
            }
            if (transition.queueOut === null) { queueOut = null; } else {
                let res = queueLookup.get(transition.queueOut.queueSymbol);
                if (res === undefined) { throw new Error(`Queue symbol ${transition.queueOut.queueSymbol} not found in input alphabet`); }
                queueOut = {queueSymbol: res, priority: transition.queueOut.priority};
            }
            let maybeStateFrom = stateLookup.get(transition.stateFrom);
            if (maybeStateFrom === undefined) { throw new Error(`State ${transition.stateFrom} not found in states`); }
            stateFrom = maybeStateFrom;
            let maybeStateTo = stateLookup.get(transition.stateTo);
            if (maybeStateTo === undefined) { throw new Error(`State ${transition.stateTo} not found in states`); }
            stateTo = maybeStateTo;
            transitionsIdxs.push({stateFrom, stateTo, input, queueIn, queueOut});

        }

        let automaton : PQAInternal = {
            stateCount: states.length,
            inputAlphabetCount: inputSymbols.length,
            queueAlphabetCount: queueSymbols.length,
            initialState: stateLookup.get(initialState)!,
            acceptingStates: acceptingStateIdx,
            transitionCount: transitions.length,
            transitions: transitionsIdxs,
        }
        let wordIdx: number[] = [];
        for (let symbol of word) {
            let res = inputLookup.get(symbol);
            if (res === undefined) { throw new Error(`Input ${symbol} not found in input alphabet`); }
            wordIdx.push(res);
        }
        this.runState = new RunState(automaton, wordIdx.reverse());
    }

    public *transitions(): Generator<{index: number, value: Transition<Q, Σ, Γ>}>{
        for (let i = 0; i < this.runState.automaton.transitionCount; i++) {
            let transitionIdx = this.runState.automaton.transitions[i];
            let input: null | Σ, queueIn: null | { queueSymbol: Γ, priority: number}, queueOut: null | { queueSymbol: Γ, priority: number};
            if (transitionIdx.input === null) { input = null} else {input = this.inputSymbols[transitionIdx.input];}
            if (transitionIdx.queueIn === null) { queueIn = null} else {queueIn = {queueSymbol: this.queueSymbols[transitionIdx.queueIn.queueSymbol], priority: transitionIdx.queueIn.priority};}
            if (transitionIdx.queueOut === null) {queueOut = null} else {queueOut = {queueSymbol: this.queueSymbols[transitionIdx.queueOut.queueSymbol], priority: transitionIdx.queueOut.priority};}
            let stateFrom = this.states[transitionIdx.stateFrom];
            let stateTo = this.states[transitionIdx.stateTo];
            yield {index: i, value: {stateFrom, stateTo, input, queueIn, queueOut}}
        }
    }

    public get state(): Q {
        return this.states[this.runState.state]
    }

    public get word(): Σ[] {
        let word: Σ[] = [];
        for (let i of this.runState.word) {
            word.push(this.inputSymbols[i])
        }
        return word.reverse();
    }

    public *queue(): Generator<{ queueSymbol: Γ, priority: number, count: number}> {
        for (let [priority, map] of this.runState.queue) {
            for (let [queueSymbol, count] of map) {
                yield {queueSymbol: this.queueSymbols[queueSymbol], priority, count}
            }
        }
    }

    public tryTransition(transitionIdx: number): boolean {
        return this.runState.tryRunTransition(transitionIdx);
    }
}