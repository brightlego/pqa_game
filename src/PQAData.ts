import {PQARun, Transition} from "./PQA";

type position = { x : number, y : number }

type pathPoint = (position & { state: undefined, offset: undefined }) | { state: string, offset?: number }

type labelPosition = position & { angle: undefined } | { angle: "N" | "NW" | "W" | "SW" | "S" | "SE" | "E" | "NE" | number }

const STATE_RADIUS: number = 30;

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
        path?: pathPoint[] & {offset: undefined} | {offset: number},
        labelPosition: labelPosition,
        labelAlign?: "left" | "center" | "right",
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
    transitions: { transition: Transition<string, string, string>, path: position[], labelPosition: position, labelAlign: "left" | "center" | "right"}[];
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

            let rawPath: pathPoint[];
            if (transition.path?.offset !== undefined || transition.path === undefined) {
                rawPath = [{"state": stateFrom, "offset": transition.path?.offset}, {"state": stateTo, "offset": transition.path?.offset}]
            } else {
                rawPath = transition.path;
            }

            let path = this.createPath(rawPath);

            let labelPosition = this.createLabelPosition(transition.labelPosition, path);

            let labelAlign = transition.labelAlign ?? "left";

            this.transitions.push({transition: {stateFrom, stateTo, input, queueIn, queueOut}, path, labelPosition, labelAlign});
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

    createLabelPosition(position: labelPosition, path: position[]): position {
        if (position.angle === undefined) {
            return position;
        }

        let midpoint = {x: (path[0].x + path[path.length - 1].x)/2, y: (path[0].y + path[path.length - 1].y)/2};
        let angle: number;
        if (typeof position.angle === "number") {
            angle = position.angle;
        } else {
            switch (position.angle) {
                case "N": angle = 90; break;
                case "NE": angle = 45; break;
                case "E": angle = 0; break;
                case "SE": angle = -45; break;
                case "S": angle = -90; break;
                case "SW": angle = -135; break;
                case "W": angle = 180; break;
                case "NW": angle = 135; break;
                default: throw new Error(`Invalid angle ${position.angle}`);
            }
        }
        angle = -angle / 360 * 2 * Math.PI;
        let x = midpoint.x + 20 * Math.cos(angle);
        let y = midpoint.y + 20 * Math.sin(angle);
        return {x, y}
    }

    createPath(path: pathPoint[]): position[] {
        let result: position[] = [];
        for (let point of path) {
            if (point.state !== undefined) {
                if (!this.states.has(point.state)) {
                    throw new Error(`State ${point} not found in states`);
                }
                result.push(this.states.get(point.state)?.position ?? {x: 0, y: 0})
            } else {
                result.push(point);
            }
        }

        if (path.length > 1) {
            let head = path[0];
            let newHead;
            if (head.state !== undefined) {
                let offset = head.offset ?? 0;
                let start = result[0];
                let end = result[1];
                let dist = Math.sqrt((start.x - end.x)*(start.x - end.x) + (start.y - end.y)*(start.y - end.y));

                let t = (Math.sqrt(STATE_RADIUS*STATE_RADIUS - offset*offset) - 2)/dist;
                let x = start.x + (start.y - end.y)*offset/dist + t*(end.x - start.x);
                let y = start.y + (end.x - start.x)*offset/dist + t*(end.y - start.y);
                newHead = {x, y};
            } else {
                newHead = result[0];
            }

            let tail = path[path.length - 1];
            let newTail;
            if (tail.state !== undefined) {
                let offset = tail.offset ?? 0;
                let start = result[path.length - 2];
                let end = result[path.length - 1];
                let dist = Math.sqrt((start.x - end.x)*(start.x - end.x) + (start.y - end.y)*(start.y - end.y));

                let t = 1 - (Math.sqrt(STATE_RADIUS*STATE_RADIUS - offset*offset) + 2)/dist;
                let x = start.x + (start.y - end.y)*offset/dist + t*(end.x - start.x);
                let y = start.y + (end.x - start.x)*offset/dist + t*(end.y - start.y);
                newTail = {x, y};
            } else {
                newTail = result[path.length - 1];
            }

            result[0] = newHead;
            result[path.length - 1] = newTail;
        }
        return result;
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