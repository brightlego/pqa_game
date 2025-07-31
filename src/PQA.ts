// a finite number of priorities is implied by a finite number of transitions
import {PQAData} from "./PQAData";

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

type QueueElement = { symbol: QueueIdx, priority: PriorityIdx }

export type Transition<State, Input, Queue> = {
    stateFrom: State;
    stateTo: State;
    input: null | Input;
    queueOut: null | { symbol: Queue, priority: number };
    queueIn: null | { symbol: Queue, priority: number };
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
        let count = map.get(elem.symbol);
        if (count === undefined || count === 0) { return false; }
        map.set(elem.symbol, count - 1);
        if (count === 1) {
            this.updateMaxPriority()
        }
        return true;
    }

    canRemoveElement(elem: QueueElement): boolean {
        if (elem.priority < this.maxPriority) { return false; }
        let map = this.queue.get(elem.priority);
        if (map === undefined) { return false; }
        let count = map.get(elem.symbol);
        return !(count === undefined || count === 0);
    }

    addElement(elem: QueueElement) {
        let map = this.queue.get(elem.priority);
        if (map === undefined) {
            map = new Map();
            this.queue.set(elem.priority, map);
        }
        let count = map.get(elem.symbol);
        if (count === undefined) {
            count = 0;
        }
        if (elem.priority > this.maxPriority) {
            this.maxPriority = elem.priority;
        }
        map.set(elem.symbol, count + 1);
    }

    public tryRunTransition(transitionIdx: TransitionIdx): boolean {
        console.log(`Trying to run transition ${transitionIdx}`)
        if (transitionIdx >= this.automaton.transitionCount || transitionIdx < 0) { return false; }
        let transition = this.automaton.transitions[transitionIdx];
        if (transition.stateFrom !== this.state) {
            console.warn(`From state ${transition.stateFrom} is not ${this.state}`);
            return false;
        }
        if (transition.input !== null && this.word.length > 0 && transition.input != this.word[this.word.length - 1]) {
            console.warn(`Input ${transition.input} does not match symbol ${this.word[this.word.length - 1]}`);
            return false;
        }
        if (transition.queueOut !== null && !this.tryRemoveElement(transition.queueOut)) {
            console.warn(`Unable to remove element ${transition.queueOut} from queue`);
            return false;
        }
        if (transition.input !== null) { this.word.pop(); }
        this.state = transition.stateTo;
        if (transition.queueIn !== null) { this.addElement(transition.queueIn); }
        return true;
    }

    public canRunTransition(transitionIdx: TransitionIdx): boolean {
        if (transitionIdx >= this.automaton.transitionCount || transitionIdx < 0) { return false; }
        let transition = this.automaton.transitions[transitionIdx];
        if (transition.stateFrom !== this.state) {
            return false;
        }
        if (transition.input !== null && this.word.length > 0 && transition.input != this.word[this.word.length - 1]) {
            return false;
        }
        return !(transition.queueOut !== null && !this.canRemoveElement(transition.queueOut));


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
    private stateLookup: Map<Q, StateIdx>;
    private inputLookup: Map<Σ, StateIdx>;
    private queueLookup: Map<Γ, StateIdx>;
    originData: PQAData | null = null;

    generateTransitions(transitions: Transition<Q, Σ, Γ>[]): TransitionInternal[] {
        let transitionsIdxs: TransitionInternal[] = [];
        for (let transition of transitions) {
            let input: InputIdx | null, queueIn: QueueElement | null, queueOut: QueueElement | null, stateFrom: StateIdx, stateTo: StateIdx;
            if (transition.input === null) { input = null; } else {
                let res = this.inputLookup.get(transition.input);
                if (res === undefined) { throw new Error(`Input ${transition.input} not found in input alphabet`); }
                input = res;
            }
            if (transition.queueIn === null) { queueIn = null; } else {
                let res = this.queueLookup.get(transition.queueIn.symbol);
                if (res === undefined) { throw new Error(`Queue symbol ${transition.queueIn.symbol} not found in input alphabet`); }
                queueIn = {symbol: res, priority: transition.queueIn.priority};
            }
            if (transition.queueOut === null) { queueOut = null; } else {
                let res = this.queueLookup.get(transition.queueOut.symbol);
                if (res === undefined) { throw new Error(`Queue symbol ${transition.queueOut.symbol} not found in input alphabet`); }
                queueOut = {symbol: res, priority: transition.queueOut.priority};
            }
            let maybeStateFrom = this.stateLookup.get(transition.stateFrom);
            if (maybeStateFrom === undefined) { throw new Error(`State ${transition.stateFrom} not found in states`); }
            stateFrom = maybeStateFrom;
            let maybeStateTo = this.stateLookup.get(transition.stateTo);
            if (maybeStateTo === undefined) { throw new Error(`State ${transition.stateTo} not found in states`); }
            stateTo = maybeStateTo;
            transitionsIdxs.push({stateFrom, stateTo, input, queueIn, queueOut});

        }
        return transitionsIdxs;
    }

    constructor(states: Q[], inputSymbols: Σ[], queueSymbols: Γ[], initialState: Q, acceptingStates: Set<Q>, transitions: Transition<Q, Σ, Γ>[], word: Σ[], originData: PQAData | null = null) {
        this.states = states;
        this.inputSymbols = inputSymbols;
        this.queueSymbols = queueSymbols;

        this.originData = originData;

        this.stateLookup = new Map<Q, StateIdx>()
        for (let i = 0; i < states.length; i++) { this.stateLookup.set(states[i], i); }

        this.inputLookup = new Map<Σ, StateIdx>()
        for (let i = 0; i < inputSymbols.length; i++) { this.inputLookup.set(inputSymbols[i], i); }

        this.queueLookup = new Map<Γ, StateIdx>()
        for (let i = 0; i < queueSymbols.length; i++) { this.queueLookup.set(queueSymbols[i], i); }

        if (!this.stateLookup.has(initialState)) { throw new Error(`Initial state ${initialState} not found in states`); }

        let acceptingStateIdx = new Set<StateIdx>()
        for (let state of acceptingStates) {
            let res = this.stateLookup.get(state);
            if (res !== undefined) { acceptingStateIdx.add(res); }
            else { throw new Error(`Accepting state ${state} not found in states`)}
        }

        let transitionsIdxs = this.generateTransitions(transitions);

        let automaton : PQAInternal = {
            stateCount: states.length,
            inputAlphabetCount: inputSymbols.length,
            queueAlphabetCount: queueSymbols.length,
            initialState: this.stateLookup.get(initialState)!,
            acceptingStates: acceptingStateIdx,
            transitionCount: transitions.length,
            transitions: transitionsIdxs,
        }
        let wordIdx: number[] = [];
        for (let symbol of word) {
            let res = this.inputLookup.get(symbol);
            if (res === undefined) { throw new Error(`Input ${symbol} not found in input alphabet`); }
            wordIdx.push(res);
        }
        this.runState = new RunState(automaton, wordIdx.reverse());
    }

    public *transitions(): Generator<{index: number, value: Transition<Q, Σ, Γ>}>{
        for (let i = 0; i < this.runState.automaton.transitionCount; i++) {
            let transitionIdx = this.runState.automaton.transitions[i];
            let input: null | Σ, queueIn: null | { symbol: Γ, priority: number}, queueOut: null | { symbol: Γ, priority: number};
            if (transitionIdx.input === null) { input = null} else {input = this.inputSymbols[transitionIdx.input];}
            if (transitionIdx.queueIn === null) { queueIn = null} else {queueIn = {symbol: this.queueSymbols[transitionIdx.queueIn.symbol], priority: transitionIdx.queueIn.priority};}
            if (transitionIdx.queueOut === null) {queueOut = null} else {queueOut = {symbol: this.queueSymbols[transitionIdx.queueOut.symbol], priority: transitionIdx.queueOut.priority};}
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

    public *queue(): Generator<{ symbol: Γ, priority: number, count: number}> {
        for (let [priority, map] of this.runState.queue) {
            for (let [symbol, count] of map) {
                yield {symbol: this.queueSymbols[symbol], priority, count}
            }
        }
    }

    public tryTransition(transitionIdx: TransitionIdx): boolean {
        return this.runState.tryRunTransition(transitionIdx);
    }

    public canRunTransition(transitionIdx: TransitionIdx): boolean {
        return this.runState.canRunTransition(transitionIdx);
    }

    public tryTransitionRun(transitions: TransitionIdx[]): boolean {
        for (let transitionIdx of transitions) {
            if (!this.tryTransition(transitionIdx)) { return false; }
        }
        return true;
    }

    public canAccept(): boolean {
        return this.runState.canAccept()
    }
}