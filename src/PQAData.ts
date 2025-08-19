import {PQARun, Transition} from "./PQA";

type position = { x : number, y : number }

export type dataFormat = {
    states: { name: string, position: position, isAccepting: boolean }[],
    inputAlphabet: string[],
    queueAlphabet: string[],
    transitions:
    {
        stateFrom: string,
        stateTo: string,
        input: string | null,
        queueIn: { symbol: string, priority: number } | null,
        queueOut: { symbol: string, priority: number } | null,
        path: position[],
        labelPosition: position
    }[]
    priorities: number[],
    initialState: string,
    word: string[],
    hideQueue?: boolean,
}

export class PQAData {
    states: Map<string, { position: position, isAccepting: boolean }>;
    inputAlphabet: Set<string>;
    queueAlphabet: Set<string>;
    transitions: { transition: Transition<string, string, string>, path: position[], labelPosition: position}[];
    initialState: string;
    priorities: number[];
    word: string[];
    queueHidden: boolean;

    /*

    {
        states: {name: string, x: number, y: number, isAccepting: boolean}[],
        inputAlphabet: string[],
        queueAlphabet: string[],
        transitions:
        {
            stateFrom: string,
            stateTo: string,
            input: string | null,
            queueIn: { symbol: string, priority: number } | null,
            queueOut: { symbol: string, priority: number } | null,
        },
        priorities: number[],
        initialState: string,
        word: string[]

    }
     */
    public constructor(data: string | dataFormat) {

        let value: dataFormat;
        if (typeof data === "string") {
            value = JSON.parse(data) as dataFormat;
        } else {
            value = data;
        }
        this.states = new Map();
        for (let state of value.states) {
            this.states.set(state.name, { position: { x: state.position.x, y: state.position.y }, isAccepting: state.isAccepting })
        }
        this.inputAlphabet = new Set();
        for (let symbol of value.inputAlphabet) {
            this.inputAlphabet.add(symbol);
        }
        this.queueAlphabet = new Set();
        for (let symbol of value.queueAlphabet) {
            this.queueAlphabet.add(symbol);
        }
        this.transitions = [];
        for (let transition of value.transitions) {
            let stateFrom = transition.stateFrom;
            let stateTo = transition.stateTo;
            if (!this.states.has(stateFrom)) {
                throw new Error(`State ${stateFrom} not found in states`);
            }
            if (!this.states.has(stateTo)) {
                throw new Error(`State ${stateTo} not found in states`);
            }
            let input = transition.input;
            if (input !== null && !this.inputAlphabet.has(input)) {
                throw new Error(`Input Symbol ${input} is not valid`)
            }
            let queueIn = transition.queueIn;
            let queueOut = transition.queueOut;
            if (queueIn !== null && !this.queueAlphabet.has(queueIn.symbol)) {
                throw new Error(`Queue Symbol ${queueIn.symbol} is not valid`)
            }
            if (queueOut !== null && !this.queueAlphabet.has(queueOut.symbol)) {
                throw new Error(`Queue Symbol ${queueOut.symbol} is not valid`)
            }

            let path = [];
            for (let {x, y} of transition.path) {
                path.push({x, y});
            }

            let labelPosition = {x: transition.labelPosition.x, y: transition.labelPosition.y};

            this.transitions.push({transition: {stateFrom, stateTo, input, queueIn, queueOut}, path, labelPosition});
        }
        if (!this.states.has(value.initialState)) {
            throw new Error(`Initial state ${value.initialState} not found in states`);
        }
        this.initialState = value.initialState;
        this.word = value.word;
        this.priorities = [];
        for (let priority of value.priorities) {
            this.priorities.push(priority);
        }

        this.queueHidden = value.hideQueue ?? false;
    }

    public createPQA(): PQARun<string, string, string> {
        let states = [] as string[];
        let acceptingStates = new Set<string>();
        for (let [name, {isAccepting}] of this.states) {
            if (isAccepting) {
                acceptingStates.add(name);
            }
            states.push(name);
        }
        let inputAlphabet = Array.from(this.inputAlphabet);
        let queueAlphabet = Array.from(this.queueAlphabet);
        let initialState = this.initialState;
        let transitions = [];
        for (let {transition} of this.transitions) {
            transitions.push(transition)
        }
        return new PQARun(states, inputAlphabet, queueAlphabet, initialState, acceptingStates, transitions, this.word, this)
    }
}