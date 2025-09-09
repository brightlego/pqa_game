/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/LevelData.ts":
/*!**************************!*\
  !*** ./src/LevelData.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LevelData = void 0;
const PQAData_1 = __webpack_require__(/*! ./PQAData */ "./src/PQAData.ts");
class LevelData {
    constructor(ui) {
        this.groups = new Map();
        this.levels = new Map();
        this.ui = ui;
        this.loadLevels();
    }
    loadLevels() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let { groups, levels } = yield window.fetch("/dist/levels.json").then(r => r.text()).then(r => JSON.parse(r));
            for (let level of levels) {
                let parsedData = level;
                let pqaData = new PQAData_1.PQAData(parsedData);
                let name = parsedData.metadata.name.toString();
                let group = parsedData.metadata.group.toString();
                let id = parsedData.metadata.id.toString();
                let description = (_a = parsedData.metadata.description) !== null && _a !== void 0 ? _a : "";
                if (!this.groups.has(group)) {
                    this.groups.set(group, []);
                }
                let index = parsedData.metadata.groupIndex;
                this.groups.get(group)[index] = id;
                this.levels.set(id, { data: pqaData, group, name, prev: null, next: null, description });
            }
            for (let [groupName, ids] of this.groups) {
                let compressedIds = ids.filter(id => id !== undefined);
                this.groups.set(groupName, compressedIds);
            }
            let prevId = null;
            let currId = null;
            for (let groupName of groups) {
                let group = this.groups.get(groupName);
                if (group === undefined) {
                    continue;
                }
                for (let id of group) {
                    if (id === undefined) {
                        continue;
                    }
                    if (currId !== null) {
                        this.levels.get(currId).next = id;
                        this.levels.get(currId).prev = prevId;
                    }
                    prevId = currId;
                    currId = id;
                }
            }
            if (currId !== null) {
                this.levels.get(currId).next = null;
                this.levels.get(currId).prev = prevId;
            }
            for (let groupName of groups) {
                let group = this.groups.get(groupName);
                if (group === undefined) {
                    continue;
                }
                for (let id of group) {
                    if (id === undefined) {
                        continue;
                    }
                    let { group, name } = this.levels.get(id);
                    this.ui.addLevel(name, group, id);
                }
            }
        });
    }
    getLevelData(id) {
        return this.levels.get(id).data;
    }
    getPrevious(id) {
        return this.levels.get(id).prev;
    }
    getNext(id) {
        return this.levels.get(id).next;
    }
    getName(id) {
        return this.levels.get(id).name;
    }
    getLevelDescription(id) {
        return this.levels.get(id).description;
    }
}
exports.LevelData = LevelData;


/***/ }),

/***/ "./src/PQA.ts":
/*!********************!*\
  !*** ./src/PQA.ts ***!
  \********************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PQARun = void 0;
class RunState {
    constructor(automaton, word) {
        this.mostRecentlyAddedElement = null;
        this.mostRecentlyRemovedElement = null;
        this.maxPriority = -Infinity;
        this.queue = new Map();
        this.state = automaton.initialState;
        this.automaton = automaton;
        this.word = word;
    }
    updateMaxPriority() {
        this.maxPriority = Math.max(...this.queue.keys());
    }
    tryRemoveElement(elem) {
        if (elem.priority < this.maxPriority) {
            return false;
        }
        let map = this.queue.get(elem.priority);
        if (map === undefined) {
            return false;
        }
        let count = map.get(elem.symbol);
        if (count === undefined || count === 0) {
            return false;
        }
        map.set(elem.symbol, count - 1);
        if (count === 1) {
            this.updateMaxPriority();
        }
        this.mostRecentlyRemovedElement = elem;
        return true;
    }
    canRemoveElement(elem) {
        if (elem.priority < this.maxPriority) {
            return false;
        }
        let map = this.queue.get(elem.priority);
        if (map === undefined) {
            return false;
        }
        let count = map.get(elem.symbol);
        return !(count === undefined || count === 0);
    }
    addElement(elem) {
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
        this.mostRecentlyAddedElement = elem;
    }
    tryRunTransition(transitionIdx) {
        this.mostRecentlyRemovedElement = null;
        this.mostRecentlyAddedElement = null;
        if (transitionIdx >= this.automaton.transitionCount || transitionIdx < 0) {
            return false;
        }
        let transition = this.automaton.transitions[transitionIdx];
        if (transition.stateFrom !== this.state) {
            console.warn(`From state ${transition.stateFrom} is not ${this.state}`);
            return false;
        }
        if ((transition.input !== null && this.word.length > 0 && transition.input != this.word[this.word.length - 1]) || (transition.input !== null && this.word.length === 0)) {
            console.warn(`Input ${transition.input} does not match symbol ${this.word[this.word.length - 1]}`);
            return false;
        }
        if (transition.queueOut !== null && !this.tryRemoveElement(transition.queueOut)) {
            console.warn(`Unable to remove element ${transition.queueOut} from queue`);
            return false;
        }
        if (transition.input !== null) {
            this.word.pop();
        }
        this.state = transition.stateTo;
        if (transition.queueIn !== null) {
            this.addElement(transition.queueIn);
        }
        return true;
    }
    canRunTransition(transitionIdx) {
        if (transitionIdx >= this.automaton.transitionCount || transitionIdx < 0) {
            return false;
        }
        let transition = this.automaton.transitions[transitionIdx];
        if (transition.stateFrom !== this.state) {
            return false;
        }
        if ((transition.input !== null && this.word.length > 0 && transition.input != this.word[this.word.length - 1]) || (transition.input !== null && this.word.length === 0)) {
            return false;
        }
        return !(transition.queueOut !== null && !this.canRemoveElement(transition.queueOut));
    }
    canAccept() {
        return this.word.length === 0 && this.automaton.acceptingStates.has(this.state);
    }
    getMostRecentlyAddedElement() {
        return this.mostRecentlyAddedElement;
    }
    getMostRecentlyRemovedElement() {
        return this.mostRecentlyRemovedElement;
    }
}
// noinspection NonAsciiCharacters
class PQARun {
    generateTransitions(transitions) {
        let transitionsIdxs = [];
        for (let transition of transitions) {
            let input, queueIn, queueOut, stateFrom, stateTo;
            if (transition.input === null) {
                input = null;
            }
            else {
                let res = this.inputLookup.get(transition.input);
                if (res === undefined) {
                    throw new Error(`Input ${transition.input} not found in input alphabet`);
                }
                input = res;
            }
            if (transition.queueIn === null) {
                queueIn = null;
            }
            else {
                let res = this.queueLookup.get(transition.queueIn.symbol);
                if (res === undefined) {
                    throw new Error(`Queue symbol ${transition.queueIn.symbol} not found in input alphabet`);
                }
                queueIn = { symbol: res, priority: transition.queueIn.priority };
            }
            if (transition.queueOut === null) {
                queueOut = null;
            }
            else {
                let res = this.queueLookup.get(transition.queueOut.symbol);
                if (res === undefined) {
                    throw new Error(`Queue symbol ${transition.queueOut.symbol} not found in input alphabet`);
                }
                queueOut = { symbol: res, priority: transition.queueOut.priority };
            }
            let maybeStateFrom = this.stateLookup.get(transition.stateFrom);
            if (maybeStateFrom === undefined) {
                throw new Error(`State ${transition.stateFrom} not found in states`);
            }
            stateFrom = maybeStateFrom;
            let maybeStateTo = this.stateLookup.get(transition.stateTo);
            if (maybeStateTo === undefined) {
                throw new Error(`State ${transition.stateTo} not found in states`);
            }
            stateTo = maybeStateTo;
            transitionsIdxs.push({ stateFrom, stateTo, input, queueIn, queueOut });
        }
        return transitionsIdxs;
    }
    constructor(states, inputSymbols, queueSymbols, initialState, acceptingStates, transitions, word, originData = null) {
        this.originData = null;
        this.states = states;
        this.inputSymbols = inputSymbols;
        this.queueSymbols = queueSymbols;
        this.originData = originData;
        this.stateLookup = new Map();
        for (let i = 0; i < states.length; i++) {
            this.stateLookup.set(states[i], i);
        }
        this.inputLookup = new Map();
        for (let i = 0; i < inputSymbols.length; i++) {
            this.inputLookup.set(inputSymbols[i], i);
        }
        this.queueLookup = new Map();
        for (let i = 0; i < queueSymbols.length; i++) {
            this.queueLookup.set(queueSymbols[i], i);
        }
        if (!this.stateLookup.has(initialState)) {
            throw new Error(`Initial state ${initialState} not found in states`);
        }
        let acceptingStateIdx = new Set();
        for (let state of acceptingStates) {
            let res = this.stateLookup.get(state);
            if (res !== undefined) {
                acceptingStateIdx.add(res);
            }
            else {
                throw new Error(`Accepting state ${state} not found in states`);
            }
        }
        let transitionsIdxs = this.generateTransitions(transitions);
        let automaton = {
            stateCount: states.length,
            inputAlphabetCount: inputSymbols.length,
            queueAlphabetCount: queueSymbols.length,
            initialState: this.stateLookup.get(initialState),
            acceptingStates: acceptingStateIdx,
            transitionCount: transitions.length,
            transitions: transitionsIdxs,
        };
        let wordIdx = [];
        for (let symbol of word) {
            let res = this.inputLookup.get(symbol);
            if (res === undefined) {
                throw new Error(`Input ${symbol} not found in input alphabet`);
            }
            wordIdx.push(res);
        }
        this.runState = new RunState(automaton, wordIdx.reverse());
    }
    *transitions() {
        for (let i = 0; i < this.runState.automaton.transitionCount; i++) {
            let transitionIdx = this.runState.automaton.transitions[i];
            let input, queueIn, queueOut;
            if (transitionIdx.input === null) {
                input = null;
            }
            else {
                input = this.inputSymbols[transitionIdx.input];
            }
            if (transitionIdx.queueIn === null) {
                queueIn = null;
            }
            else {
                queueIn = { symbol: this.queueSymbols[transitionIdx.queueIn.symbol], priority: transitionIdx.queueIn.priority };
            }
            if (transitionIdx.queueOut === null) {
                queueOut = null;
            }
            else {
                queueOut = { symbol: this.queueSymbols[transitionIdx.queueOut.symbol], priority: transitionIdx.queueOut.priority };
            }
            let stateFrom = this.states[transitionIdx.stateFrom];
            let stateTo = this.states[transitionIdx.stateTo];
            yield { index: i, value: { stateFrom, stateTo, input, queueIn, queueOut } };
        }
    }
    get state() {
        return this.states[this.runState.state];
    }
    get word() {
        let word = [];
        for (let i of this.runState.word) {
            word.push(this.inputSymbols[i]);
        }
        return word.reverse();
    }
    *queue() {
        for (let [priority, map] of this.runState.queue) {
            for (let [symbol, count] of map) {
                yield { symbol: this.queueSymbols[symbol], priority, count };
            }
        }
    }
    tryTransition(transitionIdx) {
        return this.runState.tryRunTransition(transitionIdx);
    }
    canRunTransition(transitionIdx) {
        return this.runState.canRunTransition(transitionIdx);
    }
    tryTransitionRun(transitions) {
        for (let transitionIdx of transitions) {
            if (!this.tryTransition(transitionIdx)) {
                return false;
            }
        }
        return true;
    }
    canAccept() {
        return this.runState.canAccept();
    }
    getMostRecentlyAddedElement() {
        let res = this.runState.getMostRecentlyAddedElement();
        if (res === null) {
            return null;
        }
        let { symbol, priority } = res;
        return { symbol: this.queueSymbols[symbol], priority };
    }
    getMostRecentlyRemovedElement() {
        let res = this.runState.getMostRecentlyRemovedElement();
        if (res === null) {
            return null;
        }
        let { symbol, priority } = res;
        return { symbol: this.queueSymbols[symbol], priority };
    }
}
exports.PQARun = PQARun;


/***/ }),

/***/ "./src/PQAData.ts":
/*!************************!*\
  !*** ./src/PQAData.ts ***!
  \************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PQAData = void 0;
const PQA_1 = __webpack_require__(/*! ./PQA */ "./src/PQA.ts");
class PQAData {
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
    constructor(data) {
        var _a;
        let value;
        if (typeof data === "string") {
            value = JSON.parse(data);
        }
        else {
            value = data;
        }
        this.states = new Map();
        for (let state of value.states) {
            this.states.set(state.name, { position: { x: state.position.x, y: state.position.y }, isAccepting: state.isAccepting });
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
                throw new Error(`Input Symbol ${input} is not valid`);
            }
            let queueIn = transition.queueIn;
            let queueOut = transition.queueOut;
            if (queueIn !== null && !this.queueAlphabet.has(queueIn.symbol)) {
                throw new Error(`Queue Symbol ${queueIn.symbol} is not valid`);
            }
            if (queueOut !== null && !this.queueAlphabet.has(queueOut.symbol)) {
                throw new Error(`Queue Symbol ${queueOut.symbol} is not valid`);
            }
            let path = [];
            for (let { x, y } of transition.path) {
                path.push({ x, y });
            }
            let labelPosition = { x: transition.labelPosition.x, y: transition.labelPosition.y };
            this.transitions.push({ transition: { stateFrom, stateTo, input, queueIn, queueOut }, path, labelPosition });
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
        this.queueHidden = (_a = value.hideQueue) !== null && _a !== void 0 ? _a : false;
    }
    createPQA() {
        let states = [];
        let acceptingStates = new Set();
        for (let [name, { isAccepting }] of this.states) {
            if (isAccepting) {
                acceptingStates.add(name);
            }
            states.push(name);
        }
        let inputAlphabet = Array.from(this.inputAlphabet);
        let queueAlphabet = Array.from(this.queueAlphabet);
        let initialState = this.initialState;
        let transitions = [];
        for (let { transition } of this.transitions) {
            transitions.push(transition);
        }
        return new PQA_1.PQARun(states, inputAlphabet, queueAlphabet, initialState, acceptingStates, transitions, this.word, this);
    }
}
exports.PQAData = PQAData;


/***/ }),

/***/ "./src/StateDiagram.ts":
/*!*****************************!*\
  !*** ./src/StateDiagram.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StateDiagram = void 0;
function toHexCode(n) {
    return `#${n.toString(16).padStart(6, "0")}`;
}
class StateDiagram {
    constructor() {
        this.queueHidden = false;
        this.scale = 1.0;
        this.lastUpdateInfo = null;
        this.stateCanvas = document.getElementById("states");
        this.hitRegionCanvas = document.getElementById("stateHitRegion");
        this.updateScale();
        window.onresize = () => {
            this.update(null, null);
        };
    }
    updateScale() {
        this.scale = (this.stateCanvas.getBoundingClientRect().width - 4) / 700; // It was initially 700px so we are now stuck with this as a baseline
        // this.stateCanvas.height = 500 * this.scale;
        this.stateCanvas.width = 700 * this.scale;
        this.stateCanvas.height = 500 * this.scale;
        this.stateCanvas.style.height = `${500 / 700 * (this.stateCanvas.getBoundingClientRect().width - 4)}px`;
        this.hitRegionCanvas.height = 500 * this.scale;
        this.hitRegionCanvas.width = 700 * this.scale;
    }
    update(pqaData, activeState) {
        this.updateScale();
        if (pqaData === null || activeState === null) {
            if (this.lastUpdateInfo !== null) {
                pqaData = this.lastUpdateInfo.data;
                activeState = this.lastUpdateInfo.activeState;
            }
            else {
                return;
            }
        }
        this.clearCanvas();
        this.drawTransitions(pqaData);
        this.drawStates(activeState, pqaData);
        this.lastUpdateInfo = { data: pqaData, activeState: activeState };
    }
    xTransform(x) {
        return x * this.scale;
    }
    yTransform(y) {
        return y * this.scale;
    }
    setQueueHidden(queueHidden) {
        this.queueHidden = queueHidden;
    }
    clearCanvas() {
        let context = this.stateCanvas.getContext("2d");
        let hitContext = this.hitRegionCanvas.getContext("2d");
        context.clearRect(0, 0, this.stateCanvas.width, this.stateCanvas.height);
        hitContext.clearRect(0, 0, this.hitRegionCanvas.width, this.hitRegionCanvas.height);
        context.fillStyle = "white";
        hitContext.fillStyle = "white";
        context.fillRect(0, 0, this.stateCanvas.width, this.stateCanvas.height);
        hitContext.fillRect(0, 0, this.hitRegionCanvas.width, this.hitRegionCanvas.height);
    }
    // Taken from https://stackoverflow.com/questions/808826/drawing-an-arrow-using-html-canvas
    canvas_arrow(context, fromx, fromy, tox, toy) {
        fromx = this.xTransform(fromx);
        fromy = this.yTransform(fromy);
        tox = this.xTransform(tox);
        toy = this.yTransform(toy);
        let headlen = 10 * this.scale; // length of head in pixels
        let dx = tox - fromx;
        let dy = toy - fromy;
        let angle = Math.atan2(dy, dx);
        context.beginPath();
        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        context.moveTo(tox, toy);
        context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        context.stroke();
        context.closePath();
    }
    displayTransition(transition) {
        let result = "";
        if (transition.input === null) {
            result += 'ε';
        }
        else {
            result += transition.input;
        }
        if (this.queueHidden) {
            return result;
        }
        result += " : ";
        if (transition.queueOut === null) {
            result += '∅';
        }
        else {
            result += `(${transition.queueOut.symbol}, ${transition.queueOut.priority})`;
        }
        result += " ↦ ";
        if (transition.queueIn === null) {
            result += '∅';
        }
        else {
            result += `(${transition.queueIn.symbol}, ${transition.queueIn.priority})`;
        }
        return result;
    }
    drawTransitions(data) {
        let context = this.stateCanvas.getContext("2d");
        let hitContext = this.hitRegionCanvas.getContext("2d");
        let transitionIndex = 0;
        context.strokeStyle = "black";
        for (let { transition, path, labelPosition } of data.transitions) {
            context.lineWidth = 6 * this.scale;
            context.beginPath();
            for (let { x, y } of path) {
                context.lineTo(this.xTransform(x), this.yTransform(y));
            }
            context.stroke();
            context.closePath();
            this.canvas_arrow(context, path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);
            context.fillStyle = "black";
            context.font = `${Math.round(16 * this.scale)}px Arial`;
            context.textAlign = "left";
            context.textBaseline = "middle";
            context.fillText(this.displayTransition(transition), this.xTransform(labelPosition.x), this.yTransform(labelPosition.y));
            hitContext.lineWidth = 25 * this.scale;
            hitContext.strokeStyle = toHexCode(transitionIndex);
            hitContext.beginPath();
            for (let { x, y } of path) {
                hitContext.lineTo(this.xTransform(x), this.yTransform(y));
            }
            hitContext.stroke();
            hitContext.closePath();
            transitionIndex += 1;
        }
    }
    drawStates(activeState, data) {
        let context = this.stateCanvas.getContext("2d");
        for (let [state, { position, isAccepting }] of data.states) {
            if (state === activeState) {
                context.fillStyle = "yellow";
                context.strokeStyle = "red";
            }
            else {
                context.fillStyle = "white";
                context.strokeStyle = "black";
            }
            context.lineWidth = 2 * this.scale;
            context.beginPath();
            context.arc(this.xTransform(position.x), this.yTransform(position.y), 30 * this.scale, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
            context.closePath();
            context.beginPath();
            if (isAccepting) {
                context.arc(this.xTransform(position.x), this.yTransform(position.y), 25 * this.scale, 0, 2 * Math.PI);
                context.stroke();
            }
            context.closePath();
            context.fillStyle = "black";
            context.font = `${Math.round(16 * this.scale)}px Arial`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(state, this.xTransform(position.x), this.yTransform(position.y));
        }
    }
}
exports.StateDiagram = StateDiagram;


/***/ }),

/***/ "./src/game.ts":
/*!*********************!*\
  !*** ./src/game.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Game = void 0;
const gameUI_1 = __webpack_require__(/*! ./gameUI */ "./src/gameUI.ts");
const LevelData_1 = __webpack_require__(/*! ./LevelData */ "./src/LevelData.ts");
class Game {
    constructor() {
        this.ui = new gameUI_1.GameUI(this);
        this.levelData = new LevelData_1.LevelData(this.ui);
        this.pqa = null;
        Game.instance = this;
    }
    loadPQA(pqaData) {
        this.pqa = pqaData.createPQA();
        this.ui.setPQA(this.pqa);
    }
    onStateHover(e) {
        this.ui.onStateHover(e, this);
    }
    onStateClicked(e) {
        var _a;
        let transitionIdx = this.ui.getTransitionIdx(e);
        if (transitionIdx >= 0x600000) {
            return;
        }
        if (this.tryRunTransition(transitionIdx)) {
            this.ui.onTransitionClicked(e);
        }
        this.onStateHover(e);
        if ((_a = this.pqa) === null || _a === void 0 ? void 0 : _a.canAccept()) {
            this.ui.onAccept();
        }
    }
    tryRunTransition(transitionIdx) {
        let pqa;
        if (this.pqa === null) {
            this.ui.showError("No PQA loaded");
            return false;
        }
        else {
            pqa = this.pqa;
        }
        let result = pqa.tryTransition(transitionIdx);
        if (!result) {
            this.ui.showError("Unable to run transition");
        }
        this.ui.setActiveState(pqa.state);
        this.ui.updatePriorityQueue(pqa.queue());
        this.ui.updateWord(pqa.word);
        return result;
    }
    canRunTransition(transitionIdx) {
        let pqa;
        if (this.pqa === null) {
            return false;
        }
        else {
            pqa = this.pqa;
        }
        return pqa.canRunTransition(transitionIdx);
    }
    resetCurrentPQA() {
        var _a;
        let data = (_a = this.pqa) === null || _a === void 0 ? void 0 : _a.originData;
        if (data !== null && data !== undefined) {
            this.loadPQA(data);
        }
        this.ui.onReset();
    }
    getMostRecentlyAddedElement() {
        if (this.pqa === null) {
            return null;
        }
        return this.pqa.getMostRecentlyAddedElement();
    }
    getMostRecentlyRemovedElement() {
        if (this.pqa === null) {
            return null;
        }
        return this.pqa.getMostRecentlyRemovedElement();
    }
    onLevelSelect(value) {
        if (value === "") {
            return;
        }
        let data = this.levelData.getLevelData(value);
        let prev = this.levelData.getPrevious(value);
        let next = this.levelData.getNext(value);
        let name = this.levelData.getName(value);
        let description = this.levelData.getLevelDescription(value);
        this.ui.setPrevNext(prev, next);
        this.ui.setLevelName(name);
        this.ui.setLevelDescription(description);
        this.loadPQA(data);
    }
}
exports.Game = Game;
Game.instance = null;


/***/ }),

/***/ "./src/gameUI.ts":
/*!***********************!*\
  !*** ./src/gameUI.ts ***!
  \***********************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GameUI = void 0;
const game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
const StateDiagram_1 = __webpack_require__(/*! ./StateDiagram */ "./src/StateDiagram.ts");
class GameUI {
    constructor(game) {
        this.data = null;
        this.queueHidden = false;
        this.buttonClickSound = new Audio("sounds/219069__annabloom__click1.wav");
        this.resetSound = new Audio("sounds/54405__korgms2000b__button-click.wav");
        this.acceptSound = new Audio("sounds/66136__aji__ding30603-spedup.wav");
        this.stateCanvas = document.getElementById("states");
        this.queueTable = document.getElementById("queue");
        this.hitRegionCanvas = document.getElementById("stateHitRegion");
        this.wordParagraph = document.getElementById("word");
        this.previousButton = document.getElementById("prev");
        this.nextButton = document.getElementById("next");
        this.levelTitle = document.getElementById("level_name");
        this.levelGroupList = document.getElementById("levels");
        this.levelDescription = document.getElementById("level_description");
        this.levelGroups = new Map();
        this.queueTableFields = new Map();
        this.game = game;
        this.stateDiagram = new StateDiagram_1.StateDiagram();
        this.stateDiagram.clearCanvas();
    }
    setPQA(pqa) {
        if (pqa.originData === null) {
            throw new Error("PQA has no origin data, unable to construct UI");
        }
        let data = pqa.originData;
        this.data = data;
        this.setQueueTable(data);
        this.updatePriorityQueue(pqa.queue());
        this.updateWord(pqa.word);
        this.setActiveState(pqa.state);
    }
    getTransitionIdx(event) {
        let x = event.offsetX;
        let y = event.offsetY;
        let context = this.hitRegionCanvas.getContext("2d");
        let hitRegion = context.getImageData(x, y, 1, 1).data;
        return hitRegion[0] * 256 * 256 + hitRegion[1] * 256 + hitRegion[2];
    }
    onStateHover(event, game) {
        let x = event.offsetX;
        let y = event.offsetY;
        let context = this.hitRegionCanvas.getContext("2d");
        let hitRegion = context.getImageData(x, y, 1, 1).data;
        if (hitRegion[0] < 0x60) {
            if (game.canRunTransition(this.getTransitionIdx(event))) {
                this.stateCanvas.style.cursor = "pointer";
            }
            else {
                this.stateCanvas.style.cursor = "not-allowed";
            }
        }
        else {
            this.stateCanvas.style.cursor = "default";
        }
    }
    setQueueTable(data) {
        if (data.queueHidden) {
            this.queueTable.hidden = true;
            this.queueHidden = true;
            this.stateDiagram.setQueueHidden(true);
            return;
        }
        this.queueTable.hidden = false;
        this.queueHidden = false;
        this.stateDiagram.setQueueHidden(false);
        this.queueTable.innerHTML = "";
        this.setQueueTableHead(data);
        this.setQueueTableBody(data);
    }
    setQueueTableHead(data) {
        let head = this.queueTable.createTHead();
        let columnHeaders = head.insertRow();
        let cell = columnHeaders.insertCell();
        cell.outerHTML = `<th>Priorities</th>`;
        for (let queueSymbol of data.queueAlphabet) {
            let cell = columnHeaders.insertCell();
            cell.outerHTML = `<th>${queueSymbol}</th>`;
            cell.scope = "col";
        }
    }
    setQueueTableBody(data) {
        let body = this.queueTable.createTBody();
        for (let priority of data.priorities) {
            let row = body.insertRow();
            let header = row.insertCell();
            header.outerHTML = `<th>${priority}</th>`;
            header.scope = "row";
            for (let queueSymbol of data.queueAlphabet) {
                let cell = row.insertCell();
                this.queueTableFields.set([queueSymbol, priority].toString(), cell);
            }
        }
    }
    updatePriorityQueue(queue) {
        if (this.queueTable.hidden) {
            return;
        }
        for (let { symbol, priority, count } of queue) {
            if (count === 0) {
                this.queueTableFields.get([symbol, priority].toString()).innerText = "";
            }
            else {
                this.queueTableFields.get([symbol, priority].toString()).innerText = count.toString();
            }
        }
    }
    showError(message) {
        console.log(message);
    }
    setActiveState(state) {
        this.stateDiagram.update(this.data, state);
    }
    updateWord(word) {
        this.wordParagraph.innerText = word.join(" ");
    }
    createInProjectile(e) {
        let queueInType = this.game.getMostRecentlyAddedElement();
        if (queueInType === null) {
            return;
        }
        let inProjectile = document.createElement("div");
        inProjectile.classList.add("projectile", "red");
        let targetElem = this.queueTableFields.get([queueInType.symbol, queueInType.priority].toString());
        targetElem.innerText = (parseInt(targetElem.innerText) - 1).toString();
        let target = targetElem.getBoundingClientRect();
        document.body.prepend(inProjectile);
        console.log(e.x, e.y, target.x, target.y);
        inProjectile.animate([
            {
                transform: `translate(${e.x}px, ${e.y}px)`
            },
            {
                transform: `translate(${target.x + 0.5 * target.width}px, ${target.y + 0.5 * target.height}px)`
            }
        ], {
            duration: 200,
        });
        setTimeout(() => {
            targetElem.innerText = (1 + parseInt(targetElem.innerText)).toString();
            inProjectile.style.transform = `translate(${target.x + 0.5 * target.width}px, ${target.y + 0.5 * target.height}px)`;
        }, 200);
        setTimeout(() => {
            inProjectile.remove();
        }, 300);
    }
    createOutProjectile(e) {
        let queueOutType = this.game.getMostRecentlyRemovedElement();
        if (queueOutType === null) {
            return;
        }
        let outProjectile = document.createElement("div");
        outProjectile.classList.add("projectile", "red");
        let target = this.queueTableFields.get([queueOutType.symbol, queueOutType.priority].toString()).getBoundingClientRect();
        document.body.prepend(outProjectile);
        console.log(e.x, e.y, target.x, target.y);
        outProjectile.animate([
            {
                transform: `translate(${target.x + 0.5 * target.width}px, ${target.y + 0.5 * target.height}px)`
            },
            {
                transform: `translate(${e.x}px, ${e.y}px)`
            }
        ], {
            duration: 200,
        });
        setTimeout(() => {
            outProjectile.style.transform = `translate(${e.x}px, ${e.y}px)`;
        }, 200);
        setTimeout(() => {
            outProjectile.remove();
        }, 300);
    }
    onTransitionClicked(e) {
        this.buttonClickSound.play();
        this.createInProjectile(e);
        this.createOutProjectile(e);
    }
    onReset() {
        this.resetSound.play();
    }
    onAccept() {
        this.acceptSound.play();
        document.getElementById("accepted").showModal();
    }
    addLevel(levelName, group, id) {
        if (!this.levelGroups.has(group)) {
            let groupElement = document.createElement("li");
            let header = document.createElement("h2");
            header.innerText = group;
            groupElement.appendChild(header);
            let list = document.createElement("ol");
            groupElement.appendChild(list);
            this.levelGroupList.appendChild(groupElement);
            this.levelGroups.set(group, list);
        }
        let groupElement = this.levelGroups.get(group);
        let listElem = document.createElement("li");
        let button = document.createElement("button");
        button.innerText = levelName;
        button.onclick = () => { var _a; (_a = game_1.Game.instance) === null || _a === void 0 ? void 0 : _a.onLevelSelect(id); };
        listElem.appendChild(button);
        groupElement.appendChild(listElem);
    }
    setPrevNext(prev, next) {
        if (prev === null) {
            this.previousButton.disabled = true;
            this.previousButton.value = "";
        }
        else {
            this.previousButton.disabled = false;
            this.previousButton.value = prev;
        }
        if (next === null) {
            this.nextButton.disabled = true;
            this.nextButton.value = "";
        }
        else {
            this.nextButton.disabled = false;
            this.nextButton.value = next;
        }
    }
    setLevelName(name) {
        this.levelTitle.innerText = name;
    }
    setLevelDescription(description) {
        this.levelDescription.innerHTML = description;
    }
}
exports.GameUI = GameUI;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const game_1 = __webpack_require__(/*! ./game */ "./src/game.ts");
function main() {
    var _a, _b;
    let game = new game_1.Game();
    (_a = document.getElementById("states")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", (e) => {
        var _a;
        (_a = game_1.Game.instance) === null || _a === void 0 ? void 0 : _a.onStateClicked(e);
    });
    (_b = document.getElementById("states")) === null || _b === void 0 ? void 0 : _b.addEventListener("mousemove", (e) => {
        var _a;
        (_a = game_1.Game.instance) === null || _a === void 0 ? void 0 : _a.onStateHover(e);
    });
}
main();
// Expose the Game class for use in HTML
// @ts-ignore
window["Game"] = game_1.Game;

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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VDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDLFFBQVE7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjOzs7Ozs7O1VDM09kO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7QUN0QmE7QUFDYiw4Q0FBNkMsRUFBRSxhQUFhLEVBQUM7QUFDN0QsZUFBZSxtQkFBTyxDQUFDLDZCQUFRO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL3BxYV9nYW1lLy4vc3JjL0xldmVsRGF0YS50cyIsIndlYnBhY2s6Ly9wcWFfZ2FtZS8uL3NyYy9QUUEudHMiLCJ3ZWJwYWNrOi8vcHFhX2dhbWUvLi9zcmMvUFFBRGF0YS50cyIsIndlYnBhY2s6Ly9wcWFfZ2FtZS8uL3NyYy9TdGF0ZURpYWdyYW0udHMiLCJ3ZWJwYWNrOi8vcHFhX2dhbWUvLi9zcmMvZ2FtZS50cyIsIndlYnBhY2s6Ly9wcWFfZ2FtZS8uL3NyYy9nYW1lVUkudHMiLCJ3ZWJwYWNrOi8vcHFhX2dhbWUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vcHFhX2dhbWUvLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuTGV2ZWxEYXRhID0gdm9pZCAwO1xuY29uc3QgUFFBRGF0YV8xID0gcmVxdWlyZShcIi4vUFFBRGF0YVwiKTtcbmNsYXNzIExldmVsRGF0YSB7XG4gICAgY29uc3RydWN0b3IodWkpIHtcbiAgICAgICAgdGhpcy5ncm91cHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubGV2ZWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnVpID0gdWk7XG4gICAgICAgIHRoaXMubG9hZExldmVscygpO1xuICAgIH1cbiAgICBsb2FkTGV2ZWxzKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgdmFyIF9hO1xuICAgICAgICAgICAgbGV0IHsgZ3JvdXBzLCBsZXZlbHMgfSA9IHlpZWxkIHdpbmRvdy5mZXRjaChcIi9kaXN0L2xldmVscy5qc29uXCIpLnRoZW4ociA9PiByLnRleHQoKSkudGhlbihyID0+IEpTT04ucGFyc2UocikpO1xuICAgICAgICAgICAgZm9yIChsZXQgbGV2ZWwgb2YgbGV2ZWxzKSB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZERhdGEgPSBsZXZlbDtcbiAgICAgICAgICAgICAgICBsZXQgcHFhRGF0YSA9IG5ldyBQUUFEYXRhXzEuUFFBRGF0YShwYXJzZWREYXRhKTtcbiAgICAgICAgICAgICAgICBsZXQgbmFtZSA9IHBhcnNlZERhdGEubWV0YWRhdGEubmFtZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIGxldCBncm91cCA9IHBhcnNlZERhdGEubWV0YWRhdGEuZ3JvdXAudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSBwYXJzZWREYXRhLm1ldGFkYXRhLmlkLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgbGV0IGRlc2NyaXB0aW9uID0gKF9hID0gcGFyc2VkRGF0YS5tZXRhZGF0YS5kZXNjcmlwdGlvbikgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogXCJcIjtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZ3JvdXBzLmhhcyhncm91cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ncm91cHMuc2V0KGdyb3VwLCBbXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IHBhcnNlZERhdGEubWV0YWRhdGEuZ3JvdXBJbmRleDtcbiAgICAgICAgICAgICAgICB0aGlzLmdyb3Vwcy5nZXQoZ3JvdXApW2luZGV4XSA9IGlkO1xuICAgICAgICAgICAgICAgIHRoaXMubGV2ZWxzLnNldChpZCwgeyBkYXRhOiBwcWFEYXRhLCBncm91cCwgbmFtZSwgcHJldjogbnVsbCwgbmV4dDogbnVsbCwgZGVzY3JpcHRpb24gfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBbZ3JvdXBOYW1lLCBpZHNdIG9mIHRoaXMuZ3JvdXBzKSB7XG4gICAgICAgICAgICAgICAgbGV0IGNvbXByZXNzZWRJZHMgPSBpZHMuZmlsdGVyKGlkID0+IGlkICE9PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ3JvdXBzLnNldChncm91cE5hbWUsIGNvbXByZXNzZWRJZHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHByZXZJZCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgY3VycklkID0gbnVsbDtcbiAgICAgICAgICAgIGZvciAobGV0IGdyb3VwTmFtZSBvZiBncm91cHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXAgPSB0aGlzLmdyb3Vwcy5nZXQoZ3JvdXBOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaWQgb2YgZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJySWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGV2ZWxzLmdldChjdXJySWQpLm5leHQgPSBpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGV2ZWxzLmdldChjdXJySWQpLnByZXYgPSBwcmV2SWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcHJldklkID0gY3VycklkO1xuICAgICAgICAgICAgICAgICAgICBjdXJySWQgPSBpZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY3VycklkICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sZXZlbHMuZ2V0KGN1cnJJZCkubmV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5sZXZlbHMuZ2V0KGN1cnJJZCkucHJldiA9IHByZXZJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGdyb3VwTmFtZSBvZiBncm91cHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXAgPSB0aGlzLmdyb3Vwcy5nZXQoZ3JvdXBOYW1lKTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JvdXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaWQgb2YgZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCB7IGdyb3VwLCBuYW1lIH0gPSB0aGlzLmxldmVscy5nZXQoaWQpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVpLmFkZExldmVsKG5hbWUsIGdyb3VwLCBpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0TGV2ZWxEYXRhKGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5nZXQoaWQpLmRhdGE7XG4gICAgfVxuICAgIGdldFByZXZpb3VzKGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5nZXQoaWQpLnByZXY7XG4gICAgfVxuICAgIGdldE5leHQoaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGV2ZWxzLmdldChpZCkubmV4dDtcbiAgICB9XG4gICAgZ2V0TmFtZShpZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXZlbHMuZ2V0KGlkKS5uYW1lO1xuICAgIH1cbiAgICBnZXRMZXZlbERlc2NyaXB0aW9uKGlkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxldmVscy5nZXQoaWQpLmRlc2NyaXB0aW9uO1xuICAgIH1cbn1cbmV4cG9ydHMuTGV2ZWxEYXRhID0gTGV2ZWxEYXRhO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLlBRQVJ1biA9IHZvaWQgMDtcbmNsYXNzIFJ1blN0YXRlIHtcbiAgICBjb25zdHJ1Y3RvcihhdXRvbWF0b24sIHdvcmQpIHtcbiAgICAgICAgdGhpcy5tb3N0UmVjZW50bHlBZGRlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vc3RSZWNlbnRseVJlbW92ZWRFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5tYXhQcmlvcml0eSA9IC1JbmZpbml0eTtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IGF1dG9tYXRvbi5pbml0aWFsU3RhdGU7XG4gICAgICAgIHRoaXMuYXV0b21hdG9uID0gYXV0b21hdG9uO1xuICAgICAgICB0aGlzLndvcmQgPSB3b3JkO1xuICAgIH1cbiAgICB1cGRhdGVNYXhQcmlvcml0eSgpIHtcbiAgICAgICAgdGhpcy5tYXhQcmlvcml0eSA9IE1hdGgubWF4KC4uLnRoaXMucXVldWUua2V5cygpKTtcbiAgICB9XG4gICAgdHJ5UmVtb3ZlRWxlbWVudChlbGVtKSB7XG4gICAgICAgIGlmIChlbGVtLnByaW9yaXR5IDwgdGhpcy5tYXhQcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBtYXAgPSB0aGlzLnF1ZXVlLmdldChlbGVtLnByaW9yaXR5KTtcbiAgICAgICAgaWYgKG1hcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGNvdW50ID0gbWFwLmdldChlbGVtLnN5bWJvbCk7XG4gICAgICAgIGlmIChjb3VudCA9PT0gdW5kZWZpbmVkIHx8IGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbWFwLnNldChlbGVtLnN5bWJvbCwgY291bnQgLSAxKTtcbiAgICAgICAgaWYgKGNvdW50ID09PSAxKSB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1heFByaW9yaXR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3N0UmVjZW50bHlSZW1vdmVkRWxlbWVudCA9IGVsZW07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYW5SZW1vdmVFbGVtZW50KGVsZW0pIHtcbiAgICAgICAgaWYgKGVsZW0ucHJpb3JpdHkgPCB0aGlzLm1heFByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1hcCA9IHRoaXMucXVldWUuZ2V0KGVsZW0ucHJpb3JpdHkpO1xuICAgICAgICBpZiAobWFwID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY291bnQgPSBtYXAuZ2V0KGVsZW0uc3ltYm9sKTtcbiAgICAgICAgcmV0dXJuICEoY291bnQgPT09IHVuZGVmaW5lZCB8fCBjb3VudCA9PT0gMCk7XG4gICAgfVxuICAgIGFkZEVsZW1lbnQoZWxlbSkge1xuICAgICAgICBsZXQgbWFwID0gdGhpcy5xdWV1ZS5nZXQoZWxlbS5wcmlvcml0eSk7XG4gICAgICAgIGlmIChtYXAgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgdGhpcy5xdWV1ZS5zZXQoZWxlbS5wcmlvcml0eSwgbWFwKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgY291bnQgPSBtYXAuZ2V0KGVsZW0uc3ltYm9sKTtcbiAgICAgICAgaWYgKGNvdW50ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvdW50ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxlbS5wcmlvcml0eSA+IHRoaXMubWF4UHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHRoaXMubWF4UHJpb3JpdHkgPSBlbGVtLnByaW9yaXR5O1xuICAgICAgICB9XG4gICAgICAgIG1hcC5zZXQoZWxlbS5zeW1ib2wsIGNvdW50ICsgMSk7XG4gICAgICAgIHRoaXMubW9zdFJlY2VudGx5QWRkZWRFbGVtZW50ID0gZWxlbTtcbiAgICB9XG4gICAgdHJ5UnVuVHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KSB7XG4gICAgICAgIHRoaXMubW9zdFJlY2VudGx5UmVtb3ZlZEVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLm1vc3RSZWNlbnRseUFkZGVkRWxlbWVudCA9IG51bGw7XG4gICAgICAgIGlmICh0cmFuc2l0aW9uSWR4ID49IHRoaXMuYXV0b21hdG9uLnRyYW5zaXRpb25Db3VudCB8fCB0cmFuc2l0aW9uSWR4IDwgMCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0cmFuc2l0aW9uID0gdGhpcy5hdXRvbWF0b24udHJhbnNpdGlvbnNbdHJhbnNpdGlvbklkeF07XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLnN0YXRlRnJvbSAhPT0gdGhpcy5zdGF0ZSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGBGcm9tIHN0YXRlICR7dHJhbnNpdGlvbi5zdGF0ZUZyb219IGlzIG5vdCAke3RoaXMuc3RhdGV9YCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCh0cmFuc2l0aW9uLmlucHV0ICE9PSBudWxsICYmIHRoaXMud29yZC5sZW5ndGggPiAwICYmIHRyYW5zaXRpb24uaW5wdXQgIT0gdGhpcy53b3JkW3RoaXMud29yZC5sZW5ndGggLSAxXSkgfHwgKHRyYW5zaXRpb24uaW5wdXQgIT09IG51bGwgJiYgdGhpcy53b3JkLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW5wdXQgJHt0cmFuc2l0aW9uLmlucHV0fSBkb2VzIG5vdCBtYXRjaCBzeW1ib2wgJHt0aGlzLndvcmRbdGhpcy53b3JkLmxlbmd0aCAtIDFdfWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLnF1ZXVlT3V0ICE9PSBudWxsICYmICF0aGlzLnRyeVJlbW92ZUVsZW1lbnQodHJhbnNpdGlvbi5xdWV1ZU91dCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgVW5hYmxlIHRvIHJlbW92ZSBlbGVtZW50ICR7dHJhbnNpdGlvbi5xdWV1ZU91dH0gZnJvbSBxdWV1ZWApO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLmlucHV0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndvcmQucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRyYW5zaXRpb24uc3RhdGVUbztcbiAgICAgICAgaWYgKHRyYW5zaXRpb24ucXVldWVJbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50KHRyYW5zaXRpb24ucXVldWVJbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhblJ1blRyYW5zaXRpb24odHJhbnNpdGlvbklkeCkge1xuICAgICAgICBpZiAodHJhbnNpdGlvbklkeCA+PSB0aGlzLmF1dG9tYXRvbi50cmFuc2l0aW9uQ291bnQgfHwgdHJhbnNpdGlvbklkeCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdHJhbnNpdGlvbiA9IHRoaXMuYXV0b21hdG9uLnRyYW5zaXRpb25zW3RyYW5zaXRpb25JZHhdO1xuICAgICAgICBpZiAodHJhbnNpdGlvbi5zdGF0ZUZyb20gIT09IHRoaXMuc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRyYW5zaXRpb24uaW5wdXQgIT09IG51bGwgJiYgdGhpcy53b3JkLmxlbmd0aCA+IDAgJiYgdHJhbnNpdGlvbi5pbnB1dCAhPSB0aGlzLndvcmRbdGhpcy53b3JkLmxlbmd0aCAtIDFdKSB8fCAodHJhbnNpdGlvbi5pbnB1dCAhPT0gbnVsbCAmJiB0aGlzLndvcmQubGVuZ3RoID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAhKHRyYW5zaXRpb24ucXVldWVPdXQgIT09IG51bGwgJiYgIXRoaXMuY2FuUmVtb3ZlRWxlbWVudCh0cmFuc2l0aW9uLnF1ZXVlT3V0KSk7XG4gICAgfVxuICAgIGNhbkFjY2VwdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMud29yZC5sZW5ndGggPT09IDAgJiYgdGhpcy5hdXRvbWF0b24uYWNjZXB0aW5nU3RhdGVzLmhhcyh0aGlzLnN0YXRlKTtcbiAgICB9XG4gICAgZ2V0TW9zdFJlY2VudGx5QWRkZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3N0UmVjZW50bHlBZGRlZEVsZW1lbnQ7XG4gICAgfVxuICAgIGdldE1vc3RSZWNlbnRseVJlbW92ZWRFbGVtZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3N0UmVjZW50bHlSZW1vdmVkRWxlbWVudDtcbiAgICB9XG59XG4vLyBub2luc3BlY3Rpb24gTm9uQXNjaWlDaGFyYWN0ZXJzXG5jbGFzcyBQUUFSdW4ge1xuICAgIGdlbmVyYXRlVHJhbnNpdGlvbnModHJhbnNpdGlvbnMpIHtcbiAgICAgICAgbGV0IHRyYW5zaXRpb25zSWR4cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2l0aW9uIG9mIHRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBsZXQgaW5wdXQsIHF1ZXVlSW4sIHF1ZXVlT3V0LCBzdGF0ZUZyb20sIHN0YXRlVG87XG4gICAgICAgICAgICBpZiAodHJhbnNpdGlvbi5pbnB1dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlucHV0ID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCByZXMgPSB0aGlzLmlucHV0TG9va3VwLmdldCh0cmFuc2l0aW9uLmlucHV0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnB1dCAke3RyYW5zaXRpb24uaW5wdXR9IG5vdCBmb3VuZCBpbiBpbnB1dCBhbHBoYWJldGApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbnB1dCA9IHJlcztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0cmFuc2l0aW9uLnF1ZXVlSW4gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZUluID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxldCByZXMgPSB0aGlzLnF1ZXVlTG9va3VwLmdldCh0cmFuc2l0aW9uLnF1ZXVlSW4uc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBRdWV1ZSBzeW1ib2wgJHt0cmFuc2l0aW9uLnF1ZXVlSW4uc3ltYm9sfSBub3QgZm91bmQgaW4gaW5wdXQgYWxwaGFiZXRgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcXVldWVJbiA9IHsgc3ltYm9sOiByZXMsIHByaW9yaXR5OiB0cmFuc2l0aW9uLnF1ZXVlSW4ucHJpb3JpdHkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0cmFuc2l0aW9uLnF1ZXVlT3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcXVldWVPdXQgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlcyA9IHRoaXMucXVldWVMb29rdXAuZ2V0KHRyYW5zaXRpb24ucXVldWVPdXQuc3ltYm9sKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBRdWV1ZSBzeW1ib2wgJHt0cmFuc2l0aW9uLnF1ZXVlT3V0LnN5bWJvbH0gbm90IGZvdW5kIGluIGlucHV0IGFscGhhYmV0YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHF1ZXVlT3V0ID0geyBzeW1ib2w6IHJlcywgcHJpb3JpdHk6IHRyYW5zaXRpb24ucXVldWVPdXQucHJpb3JpdHkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBtYXliZVN0YXRlRnJvbSA9IHRoaXMuc3RhdGVMb29rdXAuZ2V0KHRyYW5zaXRpb24uc3RhdGVGcm9tKTtcbiAgICAgICAgICAgIGlmIChtYXliZVN0YXRlRnJvbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdGF0ZSAke3RyYW5zaXRpb24uc3RhdGVGcm9tfSBub3QgZm91bmQgaW4gc3RhdGVzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZUZyb20gPSBtYXliZVN0YXRlRnJvbTtcbiAgICAgICAgICAgIGxldCBtYXliZVN0YXRlVG8gPSB0aGlzLnN0YXRlTG9va3VwLmdldCh0cmFuc2l0aW9uLnN0YXRlVG8pO1xuICAgICAgICAgICAgaWYgKG1heWJlU3RhdGVUbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTdGF0ZSAke3RyYW5zaXRpb24uc3RhdGVUb30gbm90IGZvdW5kIGluIHN0YXRlc2ApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGVUbyA9IG1heWJlU3RhdGVUbztcbiAgICAgICAgICAgIHRyYW5zaXRpb25zSWR4cy5wdXNoKHsgc3RhdGVGcm9tLCBzdGF0ZVRvLCBpbnB1dCwgcXVldWVJbiwgcXVldWVPdXQgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb25zSWR4cztcbiAgICB9XG4gICAgY29uc3RydWN0b3Ioc3RhdGVzLCBpbnB1dFN5bWJvbHMsIHF1ZXVlU3ltYm9scywgaW5pdGlhbFN0YXRlLCBhY2NlcHRpbmdTdGF0ZXMsIHRyYW5zaXRpb25zLCB3b3JkLCBvcmlnaW5EYXRhID0gbnVsbCkge1xuICAgICAgICB0aGlzLm9yaWdpbkRhdGEgPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXRlcyA9IHN0YXRlcztcbiAgICAgICAgdGhpcy5pbnB1dFN5bWJvbHMgPSBpbnB1dFN5bWJvbHM7XG4gICAgICAgIHRoaXMucXVldWVTeW1ib2xzID0gcXVldWVTeW1ib2xzO1xuICAgICAgICB0aGlzLm9yaWdpbkRhdGEgPSBvcmlnaW5EYXRhO1xuICAgICAgICB0aGlzLnN0YXRlTG9va3VwID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZUxvb2t1cC5zZXQoc3RhdGVzW2ldLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmlucHV0TG9va3VwID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0U3ltYm9scy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbnB1dExvb2t1cC5zZXQoaW5wdXRTeW1ib2xzW2ldLCBpKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXVlTG9va3VwID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHF1ZXVlU3ltYm9scy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZUxvb2t1cC5zZXQocXVldWVTeW1ib2xzW2ldLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMuc3RhdGVMb29rdXAuaGFzKGluaXRpYWxTdGF0ZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5pdGlhbCBzdGF0ZSAke2luaXRpYWxTdGF0ZX0gbm90IGZvdW5kIGluIHN0YXRlc2ApO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhY2NlcHRpbmdTdGF0ZUlkeCA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChsZXQgc3RhdGUgb2YgYWNjZXB0aW5nU3RhdGVzKSB7XG4gICAgICAgICAgICBsZXQgcmVzID0gdGhpcy5zdGF0ZUxvb2t1cC5nZXQoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKHJlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWNjZXB0aW5nU3RhdGVJZHguYWRkKHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEFjY2VwdGluZyBzdGF0ZSAke3N0YXRlfSBub3QgZm91bmQgaW4gc3RhdGVzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRyYW5zaXRpb25zSWR4cyA9IHRoaXMuZ2VuZXJhdGVUcmFuc2l0aW9ucyh0cmFuc2l0aW9ucyk7XG4gICAgICAgIGxldCBhdXRvbWF0b24gPSB7XG4gICAgICAgICAgICBzdGF0ZUNvdW50OiBzdGF0ZXMubGVuZ3RoLFxuICAgICAgICAgICAgaW5wdXRBbHBoYWJldENvdW50OiBpbnB1dFN5bWJvbHMubGVuZ3RoLFxuICAgICAgICAgICAgcXVldWVBbHBoYWJldENvdW50OiBxdWV1ZVN5bWJvbHMubGVuZ3RoLFxuICAgICAgICAgICAgaW5pdGlhbFN0YXRlOiB0aGlzLnN0YXRlTG9va3VwLmdldChpbml0aWFsU3RhdGUpLFxuICAgICAgICAgICAgYWNjZXB0aW5nU3RhdGVzOiBhY2NlcHRpbmdTdGF0ZUlkeCxcbiAgICAgICAgICAgIHRyYW5zaXRpb25Db3VudDogdHJhbnNpdGlvbnMubGVuZ3RoLFxuICAgICAgICAgICAgdHJhbnNpdGlvbnM6IHRyYW5zaXRpb25zSWR4cyxcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHdvcmRJZHggPSBbXTtcbiAgICAgICAgZm9yIChsZXQgc3ltYm9sIG9mIHdvcmQpIHtcbiAgICAgICAgICAgIGxldCByZXMgPSB0aGlzLmlucHV0TG9va3VwLmdldChzeW1ib2wpO1xuICAgICAgICAgICAgaWYgKHJlcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnB1dCAke3N5bWJvbH0gbm90IGZvdW5kIGluIGlucHV0IGFscGhhYmV0YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3b3JkSWR4LnB1c2gocmVzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJ1blN0YXRlID0gbmV3IFJ1blN0YXRlKGF1dG9tYXRvbiwgd29yZElkeC5yZXZlcnNlKCkpO1xuICAgIH1cbiAgICAqdHJhbnNpdGlvbnMoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5ydW5TdGF0ZS5hdXRvbWF0b24udHJhbnNpdGlvbkNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGxldCB0cmFuc2l0aW9uSWR4ID0gdGhpcy5ydW5TdGF0ZS5hdXRvbWF0b24udHJhbnNpdGlvbnNbaV07XG4gICAgICAgICAgICBsZXQgaW5wdXQsIHF1ZXVlSW4sIHF1ZXVlT3V0O1xuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb25JZHguaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnB1dCA9IHRoaXMuaW5wdXRTeW1ib2xzW3RyYW5zaXRpb25JZHguaW5wdXRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb25JZHgucXVldWVJbiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlSW4gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcXVldWVJbiA9IHsgc3ltYm9sOiB0aGlzLnF1ZXVlU3ltYm9sc1t0cmFuc2l0aW9uSWR4LnF1ZXVlSW4uc3ltYm9sXSwgcHJpb3JpdHk6IHRyYW5zaXRpb25JZHgucXVldWVJbi5wcmlvcml0eSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb25JZHgucXVldWVPdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZU91dCA9IG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBxdWV1ZU91dCA9IHsgc3ltYm9sOiB0aGlzLnF1ZXVlU3ltYm9sc1t0cmFuc2l0aW9uSWR4LnF1ZXVlT3V0LnN5bWJvbF0sIHByaW9yaXR5OiB0cmFuc2l0aW9uSWR4LnF1ZXVlT3V0LnByaW9yaXR5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgc3RhdGVGcm9tID0gdGhpcy5zdGF0ZXNbdHJhbnNpdGlvbklkeC5zdGF0ZUZyb21dO1xuICAgICAgICAgICAgbGV0IHN0YXRlVG8gPSB0aGlzLnN0YXRlc1t0cmFuc2l0aW9uSWR4LnN0YXRlVG9dO1xuICAgICAgICAgICAgeWllbGQgeyBpbmRleDogaSwgdmFsdWU6IHsgc3RhdGVGcm9tLCBzdGF0ZVRvLCBpbnB1dCwgcXVldWVJbiwgcXVldWVPdXQgfSB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBzdGF0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGVzW3RoaXMucnVuU3RhdGUuc3RhdGVdO1xuICAgIH1cbiAgICBnZXQgd29yZCgpIHtcbiAgICAgICAgbGV0IHdvcmQgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSBvZiB0aGlzLnJ1blN0YXRlLndvcmQpIHtcbiAgICAgICAgICAgIHdvcmQucHVzaCh0aGlzLmlucHV0U3ltYm9sc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdvcmQucmV2ZXJzZSgpO1xuICAgIH1cbiAgICAqcXVldWUoKSB7XG4gICAgICAgIGZvciAobGV0IFtwcmlvcml0eSwgbWFwXSBvZiB0aGlzLnJ1blN0YXRlLnF1ZXVlKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBbc3ltYm9sLCBjb3VudF0gb2YgbWFwKSB7XG4gICAgICAgICAgICAgICAgeWllbGQgeyBzeW1ib2w6IHRoaXMucXVldWVTeW1ib2xzW3N5bWJvbF0sIHByaW9yaXR5LCBjb3VudCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHRyeVRyYW5zaXRpb24odHJhbnNpdGlvbklkeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TdGF0ZS50cnlSdW5UcmFuc2l0aW9uKHRyYW5zaXRpb25JZHgpO1xuICAgIH1cbiAgICBjYW5SdW5UcmFuc2l0aW9uKHRyYW5zaXRpb25JZHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnVuU3RhdGUuY2FuUnVuVHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KTtcbiAgICB9XG4gICAgdHJ5VHJhbnNpdGlvblJ1bih0cmFuc2l0aW9ucykge1xuICAgICAgICBmb3IgKGxldCB0cmFuc2l0aW9uSWR4IG9mIHRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudHJ5VHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY2FuQWNjZXB0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydW5TdGF0ZS5jYW5BY2NlcHQoKTtcbiAgICB9XG4gICAgZ2V0TW9zdFJlY2VudGx5QWRkZWRFbGVtZW50KCkge1xuICAgICAgICBsZXQgcmVzID0gdGhpcy5ydW5TdGF0ZS5nZXRNb3N0UmVjZW50bHlBZGRlZEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHJlcyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHsgc3ltYm9sLCBwcmlvcml0eSB9ID0gcmVzO1xuICAgICAgICByZXR1cm4geyBzeW1ib2w6IHRoaXMucXVldWVTeW1ib2xzW3N5bWJvbF0sIHByaW9yaXR5IH07XG4gICAgfVxuICAgIGdldE1vc3RSZWNlbnRseVJlbW92ZWRFbGVtZW50KCkge1xuICAgICAgICBsZXQgcmVzID0gdGhpcy5ydW5TdGF0ZS5nZXRNb3N0UmVjZW50bHlSZW1vdmVkRWxlbWVudCgpO1xuICAgICAgICBpZiAocmVzID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgeyBzeW1ib2wsIHByaW9yaXR5IH0gPSByZXM7XG4gICAgICAgIHJldHVybiB7IHN5bWJvbDogdGhpcy5xdWV1ZVN5bWJvbHNbc3ltYm9sXSwgcHJpb3JpdHkgfTtcbiAgICB9XG59XG5leHBvcnRzLlBRQVJ1biA9IFBRQVJ1bjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QUUFEYXRhID0gdm9pZCAwO1xuY29uc3QgUFFBXzEgPSByZXF1aXJlKFwiLi9QUUFcIik7XG5jbGFzcyBQUUFEYXRhIHtcbiAgICAvKlxuXG4gICAge1xuICAgICAgICBzdGF0ZXM6IHtuYW1lOiBzdHJpbmcsIHg6IG51bWJlciwgeTogbnVtYmVyLCBpc0FjY2VwdGluZzogYm9vbGVhbn1bXSxcbiAgICAgICAgaW5wdXRBbHBoYWJldDogc3RyaW5nW10sXG4gICAgICAgIHF1ZXVlQWxwaGFiZXQ6IHN0cmluZ1tdLFxuICAgICAgICB0cmFuc2l0aW9uczpcbiAgICAgICAge1xuICAgICAgICAgICAgc3RhdGVGcm9tOiBzdHJpbmcsXG4gICAgICAgICAgICBzdGF0ZVRvOiBzdHJpbmcsXG4gICAgICAgICAgICBpbnB1dDogc3RyaW5nIHwgbnVsbCxcbiAgICAgICAgICAgIHF1ZXVlSW46IHsgc3ltYm9sOiBzdHJpbmcsIHByaW9yaXR5OiBudW1iZXIgfSB8IG51bGwsXG4gICAgICAgICAgICBxdWV1ZU91dDogeyBzeW1ib2w6IHN0cmluZywgcHJpb3JpdHk6IG51bWJlciB9IHwgbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgcHJpb3JpdGllczogbnVtYmVyW10sXG4gICAgICAgIGluaXRpYWxTdGF0ZTogc3RyaW5nLFxuICAgICAgICB3b3JkOiBzdHJpbmdbXVxuXG4gICAgfVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsZXQgdmFsdWU7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdmFsdWUgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBkYXRhO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhdGVzID0gbmV3IE1hcCgpO1xuICAgICAgICBmb3IgKGxldCBzdGF0ZSBvZiB2YWx1ZS5zdGF0ZXMpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVzLnNldChzdGF0ZS5uYW1lLCB7IHBvc2l0aW9uOiB7IHg6IHN0YXRlLnBvc2l0aW9uLngsIHk6IHN0YXRlLnBvc2l0aW9uLnkgfSwgaXNBY2NlcHRpbmc6IHN0YXRlLmlzQWNjZXB0aW5nIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5wdXRBbHBoYWJldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChsZXQgc3ltYm9sIG9mIHZhbHVlLmlucHV0QWxwaGFiZXQpIHtcbiAgICAgICAgICAgIHRoaXMuaW5wdXRBbHBoYWJldC5hZGQoc3ltYm9sKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnF1ZXVlQWxwaGFiZXQgPSBuZXcgU2V0KCk7XG4gICAgICAgIGZvciAobGV0IHN5bWJvbCBvZiB2YWx1ZS5xdWV1ZUFscGhhYmV0KSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlQWxwaGFiZXQuYWRkKHN5bWJvbCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50cmFuc2l0aW9ucyA9IFtdO1xuICAgICAgICBmb3IgKGxldCB0cmFuc2l0aW9uIG9mIHZhbHVlLnRyYW5zaXRpb25zKSB7XG4gICAgICAgICAgICBsZXQgc3RhdGVGcm9tID0gdHJhbnNpdGlvbi5zdGF0ZUZyb207XG4gICAgICAgICAgICBsZXQgc3RhdGVUbyA9IHRyYW5zaXRpb24uc3RhdGVUbztcbiAgICAgICAgICAgIGlmICghdGhpcy5zdGF0ZXMuaGFzKHN0YXRlRnJvbSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFN0YXRlICR7c3RhdGVGcm9tfSBub3QgZm91bmQgaW4gc3RhdGVzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXRoaXMuc3RhdGVzLmhhcyhzdGF0ZVRvKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgU3RhdGUgJHtzdGF0ZVRvfSBub3QgZm91bmQgaW4gc3RhdGVzYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgaW5wdXQgPSB0cmFuc2l0aW9uLmlucHV0O1xuICAgICAgICAgICAgaWYgKGlucHV0ICE9PSBudWxsICYmICF0aGlzLmlucHV0QWxwaGFiZXQuaGFzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5wdXQgU3ltYm9sICR7aW5wdXR9IGlzIG5vdCB2YWxpZGApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHF1ZXVlSW4gPSB0cmFuc2l0aW9uLnF1ZXVlSW47XG4gICAgICAgICAgICBsZXQgcXVldWVPdXQgPSB0cmFuc2l0aW9uLnF1ZXVlT3V0O1xuICAgICAgICAgICAgaWYgKHF1ZXVlSW4gIT09IG51bGwgJiYgIXRoaXMucXVldWVBbHBoYWJldC5oYXMocXVldWVJbi5zeW1ib2wpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBRdWV1ZSBTeW1ib2wgJHtxdWV1ZUluLnN5bWJvbH0gaXMgbm90IHZhbGlkYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocXVldWVPdXQgIT09IG51bGwgJiYgIXRoaXMucXVldWVBbHBoYWJldC5oYXMocXVldWVPdXQuc3ltYm9sKSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgUXVldWUgU3ltYm9sICR7cXVldWVPdXQuc3ltYm9sfSBpcyBub3QgdmFsaWRgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxldCBwYXRoID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB7IHgsIHkgfSBvZiB0cmFuc2l0aW9uLnBhdGgpIHtcbiAgICAgICAgICAgICAgICBwYXRoLnB1c2goeyB4LCB5IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IGxhYmVsUG9zaXRpb24gPSB7IHg6IHRyYW5zaXRpb24ubGFiZWxQb3NpdGlvbi54LCB5OiB0cmFuc2l0aW9uLmxhYmVsUG9zaXRpb24ueSB9O1xuICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9ucy5wdXNoKHsgdHJhbnNpdGlvbjogeyBzdGF0ZUZyb20sIHN0YXRlVG8sIGlucHV0LCBxdWV1ZUluLCBxdWV1ZU91dCB9LCBwYXRoLCBsYWJlbFBvc2l0aW9uIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5zdGF0ZXMuaGFzKHZhbHVlLmluaXRpYWxTdGF0ZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW5pdGlhbCBzdGF0ZSAke3ZhbHVlLmluaXRpYWxTdGF0ZX0gbm90IGZvdW5kIGluIHN0YXRlc2ApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5pdGlhbFN0YXRlID0gdmFsdWUuaW5pdGlhbFN0YXRlO1xuICAgICAgICB0aGlzLndvcmQgPSB2YWx1ZS53b3JkO1xuICAgICAgICB0aGlzLnByaW9yaXRpZXMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgcHJpb3JpdHkgb2YgdmFsdWUucHJpb3JpdGllcykge1xuICAgICAgICAgICAgdGhpcy5wcmlvcml0aWVzLnB1c2gocHJpb3JpdHkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucXVldWVIaWRkZW4gPSAoX2EgPSB2YWx1ZS5oaWRlUXVldWUpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IGZhbHNlO1xuICAgIH1cbiAgICBjcmVhdGVQUUEoKSB7XG4gICAgICAgIGxldCBzdGF0ZXMgPSBbXTtcbiAgICAgICAgbGV0IGFjY2VwdGluZ1N0YXRlcyA9IG5ldyBTZXQoKTtcbiAgICAgICAgZm9yIChsZXQgW25hbWUsIHsgaXNBY2NlcHRpbmcgfV0gb2YgdGhpcy5zdGF0ZXMpIHtcbiAgICAgICAgICAgIGlmIChpc0FjY2VwdGluZykge1xuICAgICAgICAgICAgICAgIGFjY2VwdGluZ1N0YXRlcy5hZGQobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdGF0ZXMucHVzaChuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgaW5wdXRBbHBoYWJldCA9IEFycmF5LmZyb20odGhpcy5pbnB1dEFscGhhYmV0KTtcbiAgICAgICAgbGV0IHF1ZXVlQWxwaGFiZXQgPSBBcnJheS5mcm9tKHRoaXMucXVldWVBbHBoYWJldCk7XG4gICAgICAgIGxldCBpbml0aWFsU3RhdGUgPSB0aGlzLmluaXRpYWxTdGF0ZTtcbiAgICAgICAgbGV0IHRyYW5zaXRpb25zID0gW107XG4gICAgICAgIGZvciAobGV0IHsgdHJhbnNpdGlvbiB9IG9mIHRoaXMudHJhbnNpdGlvbnMpIHtcbiAgICAgICAgICAgIHRyYW5zaXRpb25zLnB1c2godHJhbnNpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBQUUFfMS5QUUFSdW4oc3RhdGVzLCBpbnB1dEFscGhhYmV0LCBxdWV1ZUFscGhhYmV0LCBpbml0aWFsU3RhdGUsIGFjY2VwdGluZ1N0YXRlcywgdHJhbnNpdGlvbnMsIHRoaXMud29yZCwgdGhpcyk7XG4gICAgfVxufVxuZXhwb3J0cy5QUUFEYXRhID0gUFFBRGF0YTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5TdGF0ZURpYWdyYW0gPSB2b2lkIDA7XG5mdW5jdGlvbiB0b0hleENvZGUobikge1xuICAgIHJldHVybiBgIyR7bi50b1N0cmluZygxNikucGFkU3RhcnQoNiwgXCIwXCIpfWA7XG59XG5jbGFzcyBTdGF0ZURpYWdyYW0ge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnF1ZXVlSGlkZGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2NhbGUgPSAxLjA7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZUluZm8gPSBudWxsO1xuICAgICAgICB0aGlzLnN0YXRlQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0ZXNcIik7XG4gICAgICAgIHRoaXMuaGl0UmVnaW9uQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0ZUhpdFJlZ2lvblwiKTtcbiAgICAgICAgdGhpcy51cGRhdGVTY2FsZSgpO1xuICAgICAgICB3aW5kb3cub25yZXNpemUgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZShudWxsLCBudWxsKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdXBkYXRlU2NhbGUoKSB7XG4gICAgICAgIHRoaXMuc2NhbGUgPSAodGhpcy5zdGF0ZUNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCAtIDQpIC8gNzAwOyAvLyBJdCB3YXMgaW5pdGlhbGx5IDcwMHB4IHNvIHdlIGFyZSBub3cgc3R1Y2sgd2l0aCB0aGlzIGFzIGEgYmFzZWxpbmVcbiAgICAgICAgLy8gdGhpcy5zdGF0ZUNhbnZhcy5oZWlnaHQgPSA1MDAgKiB0aGlzLnNjYWxlO1xuICAgICAgICB0aGlzLnN0YXRlQ2FudmFzLndpZHRoID0gNzAwICogdGhpcy5zY2FsZTtcbiAgICAgICAgdGhpcy5zdGF0ZUNhbnZhcy5oZWlnaHQgPSA1MDAgKiB0aGlzLnNjYWxlO1xuICAgICAgICB0aGlzLnN0YXRlQ2FudmFzLnN0eWxlLmhlaWdodCA9IGAkezUwMCAvIDcwMCAqICh0aGlzLnN0YXRlQ2FudmFzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoIC0gNCl9cHhgO1xuICAgICAgICB0aGlzLmhpdFJlZ2lvbkNhbnZhcy5oZWlnaHQgPSA1MDAgKiB0aGlzLnNjYWxlO1xuICAgICAgICB0aGlzLmhpdFJlZ2lvbkNhbnZhcy53aWR0aCA9IDcwMCAqIHRoaXMuc2NhbGU7XG4gICAgfVxuICAgIHVwZGF0ZShwcWFEYXRhLCBhY3RpdmVTdGF0ZSkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNjYWxlKCk7XG4gICAgICAgIGlmIChwcWFEYXRhID09PSBudWxsIHx8IGFjdGl2ZVN0YXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sYXN0VXBkYXRlSW5mbyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHBxYURhdGEgPSB0aGlzLmxhc3RVcGRhdGVJbmZvLmRhdGE7XG4gICAgICAgICAgICAgICAgYWN0aXZlU3RhdGUgPSB0aGlzLmxhc3RVcGRhdGVJbmZvLmFjdGl2ZVN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2xlYXJDYW52YXMoKTtcbiAgICAgICAgdGhpcy5kcmF3VHJhbnNpdGlvbnMocHFhRGF0YSk7XG4gICAgICAgIHRoaXMuZHJhd1N0YXRlcyhhY3RpdmVTdGF0ZSwgcHFhRGF0YSk7XG4gICAgICAgIHRoaXMubGFzdFVwZGF0ZUluZm8gPSB7IGRhdGE6IHBxYURhdGEsIGFjdGl2ZVN0YXRlOiBhY3RpdmVTdGF0ZSB9O1xuICAgIH1cbiAgICB4VHJhbnNmb3JtKHgpIHtcbiAgICAgICAgcmV0dXJuIHggKiB0aGlzLnNjYWxlO1xuICAgIH1cbiAgICB5VHJhbnNmb3JtKHkpIHtcbiAgICAgICAgcmV0dXJuIHkgKiB0aGlzLnNjYWxlO1xuICAgIH1cbiAgICBzZXRRdWV1ZUhpZGRlbihxdWV1ZUhpZGRlbikge1xuICAgICAgICB0aGlzLnF1ZXVlSGlkZGVuID0gcXVldWVIaWRkZW47XG4gICAgfVxuICAgIGNsZWFyQ2FudmFzKCkge1xuICAgICAgICBsZXQgY29udGV4dCA9IHRoaXMuc3RhdGVDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBsZXQgaGl0Q29udGV4dCA9IHRoaXMuaGl0UmVnaW9uQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgdGhpcy5zdGF0ZUNhbnZhcy53aWR0aCwgdGhpcy5zdGF0ZUNhbnZhcy5oZWlnaHQpO1xuICAgICAgICBoaXRDb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmhpdFJlZ2lvbkNhbnZhcy53aWR0aCwgdGhpcy5oaXRSZWdpb25DYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgIGhpdENvbnRleHQuZmlsbFN0eWxlID0gXCJ3aGl0ZVwiO1xuICAgICAgICBjb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuc3RhdGVDYW52YXMud2lkdGgsIHRoaXMuc3RhdGVDYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgaGl0Q29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmhpdFJlZ2lvbkNhbnZhcy53aWR0aCwgdGhpcy5oaXRSZWdpb25DYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gICAgLy8gVGFrZW4gZnJvbSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84MDg4MjYvZHJhd2luZy1hbi1hcnJvdy11c2luZy1odG1sLWNhbnZhc1xuICAgIGNhbnZhc19hcnJvdyhjb250ZXh0LCBmcm9teCwgZnJvbXksIHRveCwgdG95KSB7XG4gICAgICAgIGZyb214ID0gdGhpcy54VHJhbnNmb3JtKGZyb214KTtcbiAgICAgICAgZnJvbXkgPSB0aGlzLnlUcmFuc2Zvcm0oZnJvbXkpO1xuICAgICAgICB0b3ggPSB0aGlzLnhUcmFuc2Zvcm0odG94KTtcbiAgICAgICAgdG95ID0gdGhpcy55VHJhbnNmb3JtKHRveSk7XG4gICAgICAgIGxldCBoZWFkbGVuID0gMTAgKiB0aGlzLnNjYWxlOyAvLyBsZW5ndGggb2YgaGVhZCBpbiBwaXhlbHNcbiAgICAgICAgbGV0IGR4ID0gdG94IC0gZnJvbXg7XG4gICAgICAgIGxldCBkeSA9IHRveSAtIGZyb215O1xuICAgICAgICBsZXQgYW5nbGUgPSBNYXRoLmF0YW4yKGR5LCBkeCk7XG4gICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIGNvbnRleHQubW92ZVRvKGZyb214LCBmcm9teSk7XG4gICAgICAgIGNvbnRleHQubGluZVRvKHRveCwgdG95KTtcbiAgICAgICAgY29udGV4dC5saW5lVG8odG94IC0gaGVhZGxlbiAqIE1hdGguY29zKGFuZ2xlIC0gTWF0aC5QSSAvIDYpLCB0b3kgLSBoZWFkbGVuICogTWF0aC5zaW4oYW5nbGUgLSBNYXRoLlBJIC8gNikpO1xuICAgICAgICBjb250ZXh0Lm1vdmVUbyh0b3gsIHRveSk7XG4gICAgICAgIGNvbnRleHQubGluZVRvKHRveCAtIGhlYWRsZW4gKiBNYXRoLmNvcyhhbmdsZSArIE1hdGguUEkgLyA2KSwgdG95IC0gaGVhZGxlbiAqIE1hdGguc2luKGFuZ2xlICsgTWF0aC5QSSAvIDYpKTtcbiAgICAgICAgY29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICB9XG4gICAgZGlzcGxheVRyYW5zaXRpb24odHJhbnNpdGlvbikge1xuICAgICAgICBsZXQgcmVzdWx0ID0gXCJcIjtcbiAgICAgICAgaWYgKHRyYW5zaXRpb24uaW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAnzrUnO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ICs9IHRyYW5zaXRpb24uaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVldWVIaWRkZW4pIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ICs9IFwiIDogXCI7XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLnF1ZXVlT3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gJ+KIhSc7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYCgke3RyYW5zaXRpb24ucXVldWVPdXQuc3ltYm9sfSwgJHt0cmFuc2l0aW9uLnF1ZXVlT3V0LnByaW9yaXR5fSlgO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCArPSBcIiDihqYgXCI7XG4gICAgICAgIGlmICh0cmFuc2l0aW9uLnF1ZXVlSW4gPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSAn4oiFJztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBgKCR7dHJhbnNpdGlvbi5xdWV1ZUluLnN5bWJvbH0sICR7dHJhbnNpdGlvbi5xdWV1ZUluLnByaW9yaXR5fSlgO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGRyYXdUcmFuc2l0aW9ucyhkYXRhKSB7XG4gICAgICAgIGxldCBjb250ZXh0ID0gdGhpcy5zdGF0ZUNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGxldCBoaXRDb250ZXh0ID0gdGhpcy5oaXRSZWdpb25DYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBsZXQgdHJhbnNpdGlvbkluZGV4ID0gMDtcbiAgICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgZm9yIChsZXQgeyB0cmFuc2l0aW9uLCBwYXRoLCBsYWJlbFBvc2l0aW9uIH0gb2YgZGF0YS50cmFuc2l0aW9ucykge1xuICAgICAgICAgICAgY29udGV4dC5saW5lV2lkdGggPSA2ICogdGhpcy5zY2FsZTtcbiAgICAgICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBmb3IgKGxldCB7IHgsIHkgfSBvZiBwYXRoKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5saW5lVG8odGhpcy54VHJhbnNmb3JtKHgpLCB0aGlzLnlUcmFuc2Zvcm0oeSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIGNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmNhbnZhc19hcnJvdyhjb250ZXh0LCBwYXRoW3BhdGgubGVuZ3RoIC0gMl0ueCwgcGF0aFtwYXRoLmxlbmd0aCAtIDJdLnksIHBhdGhbcGF0aC5sZW5ndGggLSAxXS54LCBwYXRoW3BhdGgubGVuZ3RoIC0gMV0ueSk7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgIGNvbnRleHQuZm9udCA9IGAke01hdGgucm91bmQoMTYgKiB0aGlzLnNjYWxlKX1weCBBcmlhbGA7XG4gICAgICAgICAgICBjb250ZXh0LnRleHRBbGlnbiA9IFwibGVmdFwiO1xuICAgICAgICAgICAgY29udGV4dC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xuICAgICAgICAgICAgY29udGV4dC5maWxsVGV4dCh0aGlzLmRpc3BsYXlUcmFuc2l0aW9uKHRyYW5zaXRpb24pLCB0aGlzLnhUcmFuc2Zvcm0obGFiZWxQb3NpdGlvbi54KSwgdGhpcy55VHJhbnNmb3JtKGxhYmVsUG9zaXRpb24ueSkpO1xuICAgICAgICAgICAgaGl0Q29udGV4dC5saW5lV2lkdGggPSAyNSAqIHRoaXMuc2NhbGU7XG4gICAgICAgICAgICBoaXRDb250ZXh0LnN0cm9rZVN0eWxlID0gdG9IZXhDb2RlKHRyYW5zaXRpb25JbmRleCk7XG4gICAgICAgICAgICBoaXRDb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgZm9yIChsZXQgeyB4LCB5IH0gb2YgcGF0aCkge1xuICAgICAgICAgICAgICAgIGhpdENvbnRleHQubGluZVRvKHRoaXMueFRyYW5zZm9ybSh4KSwgdGhpcy55VHJhbnNmb3JtKHkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGhpdENvbnRleHQuc3Ryb2tlKCk7XG4gICAgICAgICAgICBoaXRDb250ZXh0LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdHJhbnNpdGlvbkluZGV4ICs9IDE7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZHJhd1N0YXRlcyhhY3RpdmVTdGF0ZSwgZGF0YSkge1xuICAgICAgICBsZXQgY29udGV4dCA9IHRoaXMuc3RhdGVDYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBmb3IgKGxldCBbc3RhdGUsIHsgcG9zaXRpb24sIGlzQWNjZXB0aW5nIH1dIG9mIGRhdGEuc3RhdGVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUgPT09IGFjdGl2ZVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcInllbGxvd1wiO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcInJlZFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSBcIndoaXRlXCI7XG4gICAgICAgICAgICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gMiAqIHRoaXMuc2NhbGU7XG4gICAgICAgICAgICBjb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgY29udGV4dC5hcmModGhpcy54VHJhbnNmb3JtKHBvc2l0aW9uLngpLCB0aGlzLnlUcmFuc2Zvcm0ocG9zaXRpb24ueSksIDMwICogdGhpcy5zY2FsZSwgMCwgMiAqIE1hdGguUEkpO1xuICAgICAgICAgICAgY29udGV4dC5maWxsKCk7XG4gICAgICAgICAgICBjb250ZXh0LnN0cm9rZSgpO1xuICAgICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcbiAgICAgICAgICAgIGNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBpZiAoaXNBY2NlcHRpbmcpIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmFyYyh0aGlzLnhUcmFuc2Zvcm0ocG9zaXRpb24ueCksIHRoaXMueVRyYW5zZm9ybShwb3NpdGlvbi55KSwgMjUgKiB0aGlzLnNjYWxlLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnRleHQuY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IFwiYmxhY2tcIjtcbiAgICAgICAgICAgIGNvbnRleHQuZm9udCA9IGAke01hdGgucm91bmQoMTYgKiB0aGlzLnNjYWxlKX1weCBBcmlhbGA7XG4gICAgICAgICAgICBjb250ZXh0LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgICAgICAgICBjb250ZXh0LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGxUZXh0KHN0YXRlLCB0aGlzLnhUcmFuc2Zvcm0ocG9zaXRpb24ueCksIHRoaXMueVRyYW5zZm9ybShwb3NpdGlvbi55KSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlN0YXRlRGlhZ3JhbSA9IFN0YXRlRGlhZ3JhbTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HYW1lID0gdm9pZCAwO1xuY29uc3QgZ2FtZVVJXzEgPSByZXF1aXJlKFwiLi9nYW1lVUlcIik7XG5jb25zdCBMZXZlbERhdGFfMSA9IHJlcXVpcmUoXCIuL0xldmVsRGF0YVwiKTtcbmNsYXNzIEdhbWUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnVpID0gbmV3IGdhbWVVSV8xLkdhbWVVSSh0aGlzKTtcbiAgICAgICAgdGhpcy5sZXZlbERhdGEgPSBuZXcgTGV2ZWxEYXRhXzEuTGV2ZWxEYXRhKHRoaXMudWkpO1xuICAgICAgICB0aGlzLnBxYSA9IG51bGw7XG4gICAgICAgIEdhbWUuaW5zdGFuY2UgPSB0aGlzO1xuICAgIH1cbiAgICBsb2FkUFFBKHBxYURhdGEpIHtcbiAgICAgICAgdGhpcy5wcWEgPSBwcWFEYXRhLmNyZWF0ZVBRQSgpO1xuICAgICAgICB0aGlzLnVpLnNldFBRQSh0aGlzLnBxYSk7XG4gICAgfVxuICAgIG9uU3RhdGVIb3ZlcihlKSB7XG4gICAgICAgIHRoaXMudWkub25TdGF0ZUhvdmVyKGUsIHRoaXMpO1xuICAgIH1cbiAgICBvblN0YXRlQ2xpY2tlZChlKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGV0IHRyYW5zaXRpb25JZHggPSB0aGlzLnVpLmdldFRyYW5zaXRpb25JZHgoZSk7XG4gICAgICAgIGlmICh0cmFuc2l0aW9uSWR4ID49IDB4NjAwMDAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudHJ5UnVuVHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KSkge1xuICAgICAgICAgICAgdGhpcy51aS5vblRyYW5zaXRpb25DbGlja2VkKGUpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub25TdGF0ZUhvdmVyKGUpO1xuICAgICAgICBpZiAoKF9hID0gdGhpcy5wcWEpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5jYW5BY2NlcHQoKSkge1xuICAgICAgICAgICAgdGhpcy51aS5vbkFjY2VwdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRyeVJ1blRyYW5zaXRpb24odHJhbnNpdGlvbklkeCkge1xuICAgICAgICBsZXQgcHFhO1xuICAgICAgICBpZiAodGhpcy5wcWEgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMudWkuc2hvd0Vycm9yKFwiTm8gUFFBIGxvYWRlZFwiKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHBxYSA9IHRoaXMucHFhO1xuICAgICAgICB9XG4gICAgICAgIGxldCByZXN1bHQgPSBwcWEudHJ5VHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KTtcbiAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgIHRoaXMudWkuc2hvd0Vycm9yKFwiVW5hYmxlIHRvIHJ1biB0cmFuc2l0aW9uXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudWkuc2V0QWN0aXZlU3RhdGUocHFhLnN0YXRlKTtcbiAgICAgICAgdGhpcy51aS51cGRhdGVQcmlvcml0eVF1ZXVlKHBxYS5xdWV1ZSgpKTtcbiAgICAgICAgdGhpcy51aS51cGRhdGVXb3JkKHBxYS53b3JkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgY2FuUnVuVHJhbnNpdGlvbih0cmFuc2l0aW9uSWR4KSB7XG4gICAgICAgIGxldCBwcWE7XG4gICAgICAgIGlmICh0aGlzLnBxYSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcHFhID0gdGhpcy5wcWE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBxYS5jYW5SdW5UcmFuc2l0aW9uKHRyYW5zaXRpb25JZHgpO1xuICAgIH1cbiAgICByZXNldEN1cnJlbnRQUUEoKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGV0IGRhdGEgPSAoX2EgPSB0aGlzLnBxYSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm9yaWdpbkRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSBudWxsICYmIGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5sb2FkUFFBKGRhdGEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudWkub25SZXNldCgpO1xuICAgIH1cbiAgICBnZXRNb3N0UmVjZW50bHlBZGRlZEVsZW1lbnQoKSB7XG4gICAgICAgIGlmICh0aGlzLnBxYSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMucHFhLmdldE1vc3RSZWNlbnRseUFkZGVkRWxlbWVudCgpO1xuICAgIH1cbiAgICBnZXRNb3N0UmVjZW50bHlSZW1vdmVkRWxlbWVudCgpIHtcbiAgICAgICAgaWYgKHRoaXMucHFhID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5wcWEuZ2V0TW9zdFJlY2VudGx5UmVtb3ZlZEVsZW1lbnQoKTtcbiAgICB9XG4gICAgb25MZXZlbFNlbGVjdCh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGF0YSA9IHRoaXMubGV2ZWxEYXRhLmdldExldmVsRGF0YSh2YWx1ZSk7XG4gICAgICAgIGxldCBwcmV2ID0gdGhpcy5sZXZlbERhdGEuZ2V0UHJldmlvdXModmFsdWUpO1xuICAgICAgICBsZXQgbmV4dCA9IHRoaXMubGV2ZWxEYXRhLmdldE5leHQodmFsdWUpO1xuICAgICAgICBsZXQgbmFtZSA9IHRoaXMubGV2ZWxEYXRhLmdldE5hbWUodmFsdWUpO1xuICAgICAgICBsZXQgZGVzY3JpcHRpb24gPSB0aGlzLmxldmVsRGF0YS5nZXRMZXZlbERlc2NyaXB0aW9uKHZhbHVlKTtcbiAgICAgICAgdGhpcy51aS5zZXRQcmV2TmV4dChwcmV2LCBuZXh0KTtcbiAgICAgICAgdGhpcy51aS5zZXRMZXZlbE5hbWUobmFtZSk7XG4gICAgICAgIHRoaXMudWkuc2V0TGV2ZWxEZXNjcmlwdGlvbihkZXNjcmlwdGlvbik7XG4gICAgICAgIHRoaXMubG9hZFBRQShkYXRhKTtcbiAgICB9XG59XG5leHBvcnRzLkdhbWUgPSBHYW1lO1xuR2FtZS5pbnN0YW5jZSA9IG51bGw7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuR2FtZVVJID0gdm9pZCAwO1xuY29uc3QgZ2FtZV8xID0gcmVxdWlyZShcIi4vZ2FtZVwiKTtcbmNvbnN0IFN0YXRlRGlhZ3JhbV8xID0gcmVxdWlyZShcIi4vU3RhdGVEaWFncmFtXCIpO1xuY2xhc3MgR2FtZVVJIHtcbiAgICBjb25zdHJ1Y3RvcihnYW1lKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IG51bGw7XG4gICAgICAgIHRoaXMucXVldWVIaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5idXR0b25DbGlja1NvdW5kID0gbmV3IEF1ZGlvKFwic291bmRzLzIxOTA2OV9fYW5uYWJsb29tX19jbGljazEud2F2XCIpO1xuICAgICAgICB0aGlzLnJlc2V0U291bmQgPSBuZXcgQXVkaW8oXCJzb3VuZHMvNTQ0MDVfX2tvcmdtczIwMDBiX19idXR0b24tY2xpY2sud2F2XCIpO1xuICAgICAgICB0aGlzLmFjY2VwdFNvdW5kID0gbmV3IEF1ZGlvKFwic291bmRzLzY2MTM2X19hamlfX2RpbmczMDYwMy1zcGVkdXAud2F2XCIpO1xuICAgICAgICB0aGlzLnN0YXRlQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0ZXNcIik7XG4gICAgICAgIHRoaXMucXVldWVUYWJsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicXVldWVcIik7XG4gICAgICAgIHRoaXMuaGl0UmVnaW9uQ2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0ZUhpdFJlZ2lvblwiKTtcbiAgICAgICAgdGhpcy53b3JkUGFyYWdyYXBoID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ3b3JkXCIpO1xuICAgICAgICB0aGlzLnByZXZpb3VzQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwcmV2XCIpO1xuICAgICAgICB0aGlzLm5leHRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5leHRcIik7XG4gICAgICAgIHRoaXMubGV2ZWxUaXRsZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxfbmFtZVwiKTtcbiAgICAgICAgdGhpcy5sZXZlbEdyb3VwTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGV2ZWxzXCIpO1xuICAgICAgICB0aGlzLmxldmVsRGVzY3JpcHRpb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxldmVsX2Rlc2NyaXB0aW9uXCIpO1xuICAgICAgICB0aGlzLmxldmVsR3JvdXBzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnF1ZXVlVGFibGVGaWVsZHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZ2FtZSA9IGdhbWU7XG4gICAgICAgIHRoaXMuc3RhdGVEaWFncmFtID0gbmV3IFN0YXRlRGlhZ3JhbV8xLlN0YXRlRGlhZ3JhbSgpO1xuICAgICAgICB0aGlzLnN0YXRlRGlhZ3JhbS5jbGVhckNhbnZhcygpO1xuICAgIH1cbiAgICBzZXRQUUEocHFhKSB7XG4gICAgICAgIGlmIChwcWEub3JpZ2luRGF0YSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUFFBIGhhcyBubyBvcmlnaW4gZGF0YSwgdW5hYmxlIHRvIGNvbnN0cnVjdCBVSVwiKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGF0YSA9IHBxYS5vcmlnaW5EYXRhO1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICB0aGlzLnNldFF1ZXVlVGFibGUoZGF0YSk7XG4gICAgICAgIHRoaXMudXBkYXRlUHJpb3JpdHlRdWV1ZShwcWEucXVldWUoKSk7XG4gICAgICAgIHRoaXMudXBkYXRlV29yZChwcWEud29yZCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU3RhdGUocHFhLnN0YXRlKTtcbiAgICB9XG4gICAgZ2V0VHJhbnNpdGlvbklkeChldmVudCkge1xuICAgICAgICBsZXQgeCA9IGV2ZW50Lm9mZnNldFg7XG4gICAgICAgIGxldCB5ID0gZXZlbnQub2Zmc2V0WTtcbiAgICAgICAgbGV0IGNvbnRleHQgPSB0aGlzLmhpdFJlZ2lvbkNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG4gICAgICAgIGxldCBoaXRSZWdpb24gPSBjb250ZXh0LmdldEltYWdlRGF0YSh4LCB5LCAxLCAxKS5kYXRhO1xuICAgICAgICByZXR1cm4gaGl0UmVnaW9uWzBdICogMjU2ICogMjU2ICsgaGl0UmVnaW9uWzFdICogMjU2ICsgaGl0UmVnaW9uWzJdO1xuICAgIH1cbiAgICBvblN0YXRlSG92ZXIoZXZlbnQsIGdhbWUpIHtcbiAgICAgICAgbGV0IHggPSBldmVudC5vZmZzZXRYO1xuICAgICAgICBsZXQgeSA9IGV2ZW50Lm9mZnNldFk7XG4gICAgICAgIGxldCBjb250ZXh0ID0gdGhpcy5oaXRSZWdpb25DYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgICBsZXQgaGl0UmVnaW9uID0gY29udGV4dC5nZXRJbWFnZURhdGEoeCwgeSwgMSwgMSkuZGF0YTtcbiAgICAgICAgaWYgKGhpdFJlZ2lvblswXSA8IDB4NjApIHtcbiAgICAgICAgICAgIGlmIChnYW1lLmNhblJ1blRyYW5zaXRpb24odGhpcy5nZXRUcmFuc2l0aW9uSWR4KGV2ZW50KSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXRlQ2FudmFzLnN0eWxlLmN1cnNvciA9IFwicG9pbnRlclwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZUNhbnZhcy5zdHlsZS5jdXJzb3IgPSBcIm5vdC1hbGxvd2VkXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlQ2FudmFzLnN0eWxlLmN1cnNvciA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFF1ZXVlVGFibGUoZGF0YSkge1xuICAgICAgICBpZiAoZGF0YS5xdWV1ZUhpZGRlbikge1xuICAgICAgICAgICAgdGhpcy5xdWV1ZVRhYmxlLmhpZGRlbiA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlSGlkZGVuID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGVEaWFncmFtLnNldFF1ZXVlSGlkZGVuKHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucXVldWVUYWJsZS5oaWRkZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5xdWV1ZUhpZGRlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnN0YXRlRGlhZ3JhbS5zZXRRdWV1ZUhpZGRlbihmYWxzZSk7XG4gICAgICAgIHRoaXMucXVldWVUYWJsZS5pbm5lckhUTUwgPSBcIlwiO1xuICAgICAgICB0aGlzLnNldFF1ZXVlVGFibGVIZWFkKGRhdGEpO1xuICAgICAgICB0aGlzLnNldFF1ZXVlVGFibGVCb2R5KGRhdGEpO1xuICAgIH1cbiAgICBzZXRRdWV1ZVRhYmxlSGVhZChkYXRhKSB7XG4gICAgICAgIGxldCBoZWFkID0gdGhpcy5xdWV1ZVRhYmxlLmNyZWF0ZVRIZWFkKCk7XG4gICAgICAgIGxldCBjb2x1bW5IZWFkZXJzID0gaGVhZC5pbnNlcnRSb3coKTtcbiAgICAgICAgbGV0IGNlbGwgPSBjb2x1bW5IZWFkZXJzLmluc2VydENlbGwoKTtcbiAgICAgICAgY2VsbC5vdXRlckhUTUwgPSBgPHRoPlByaW9yaXRpZXM8L3RoPmA7XG4gICAgICAgIGZvciAobGV0IHF1ZXVlU3ltYm9sIG9mIGRhdGEucXVldWVBbHBoYWJldCkge1xuICAgICAgICAgICAgbGV0IGNlbGwgPSBjb2x1bW5IZWFkZXJzLmluc2VydENlbGwoKTtcbiAgICAgICAgICAgIGNlbGwub3V0ZXJIVE1MID0gYDx0aD4ke3F1ZXVlU3ltYm9sfTwvdGg+YDtcbiAgICAgICAgICAgIGNlbGwuc2NvcGUgPSBcImNvbFwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNldFF1ZXVlVGFibGVCb2R5KGRhdGEpIHtcbiAgICAgICAgbGV0IGJvZHkgPSB0aGlzLnF1ZXVlVGFibGUuY3JlYXRlVEJvZHkoKTtcbiAgICAgICAgZm9yIChsZXQgcHJpb3JpdHkgb2YgZGF0YS5wcmlvcml0aWVzKSB7XG4gICAgICAgICAgICBsZXQgcm93ID0gYm9keS5pbnNlcnRSb3coKTtcbiAgICAgICAgICAgIGxldCBoZWFkZXIgPSByb3cuaW5zZXJ0Q2VsbCgpO1xuICAgICAgICAgICAgaGVhZGVyLm91dGVySFRNTCA9IGA8dGg+JHtwcmlvcml0eX08L3RoPmA7XG4gICAgICAgICAgICBoZWFkZXIuc2NvcGUgPSBcInJvd1wiO1xuICAgICAgICAgICAgZm9yIChsZXQgcXVldWVTeW1ib2wgb2YgZGF0YS5xdWV1ZUFscGhhYmV0KSB7XG4gICAgICAgICAgICAgICAgbGV0IGNlbGwgPSByb3cuaW5zZXJ0Q2VsbCgpO1xuICAgICAgICAgICAgICAgIHRoaXMucXVldWVUYWJsZUZpZWxkcy5zZXQoW3F1ZXVlU3ltYm9sLCBwcmlvcml0eV0udG9TdHJpbmcoKSwgY2VsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlUHJpb3JpdHlRdWV1ZShxdWV1ZSkge1xuICAgICAgICBpZiAodGhpcy5xdWV1ZVRhYmxlLmhpZGRlbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHsgc3ltYm9sLCBwcmlvcml0eSwgY291bnQgfSBvZiBxdWV1ZSkge1xuICAgICAgICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5xdWV1ZVRhYmxlRmllbGRzLmdldChbc3ltYm9sLCBwcmlvcml0eV0udG9TdHJpbmcoKSkuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMucXVldWVUYWJsZUZpZWxkcy5nZXQoW3N5bWJvbCwgcHJpb3JpdHldLnRvU3RyaW5nKCkpLmlubmVyVGV4dCA9IGNvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvd0Vycm9yKG1lc3NhZ2UpIHtcbiAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSk7XG4gICAgfVxuICAgIHNldEFjdGl2ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIHRoaXMuc3RhdGVEaWFncmFtLnVwZGF0ZSh0aGlzLmRhdGEsIHN0YXRlKTtcbiAgICB9XG4gICAgdXBkYXRlV29yZCh3b3JkKSB7XG4gICAgICAgIHRoaXMud29yZFBhcmFncmFwaC5pbm5lclRleHQgPSB3b3JkLmpvaW4oXCIgXCIpO1xuICAgIH1cbiAgICBjcmVhdGVJblByb2plY3RpbGUoZSkge1xuICAgICAgICBsZXQgcXVldWVJblR5cGUgPSB0aGlzLmdhbWUuZ2V0TW9zdFJlY2VudGx5QWRkZWRFbGVtZW50KCk7XG4gICAgICAgIGlmIChxdWV1ZUluVHlwZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBpblByb2plY3RpbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBpblByb2plY3RpbGUuY2xhc3NMaXN0LmFkZChcInByb2plY3RpbGVcIiwgXCJyZWRcIik7XG4gICAgICAgIGxldCB0YXJnZXRFbGVtID0gdGhpcy5xdWV1ZVRhYmxlRmllbGRzLmdldChbcXVldWVJblR5cGUuc3ltYm9sLCBxdWV1ZUluVHlwZS5wcmlvcml0eV0udG9TdHJpbmcoKSk7XG4gICAgICAgIHRhcmdldEVsZW0uaW5uZXJUZXh0ID0gKHBhcnNlSW50KHRhcmdldEVsZW0uaW5uZXJUZXh0KSAtIDEpLnRvU3RyaW5nKCk7XG4gICAgICAgIGxldCB0YXJnZXQgPSB0YXJnZXRFbGVtLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBkb2N1bWVudC5ib2R5LnByZXBlbmQoaW5Qcm9qZWN0aWxlKTtcbiAgICAgICAgY29uc29sZS5sb2coZS54LCBlLnksIHRhcmdldC54LCB0YXJnZXQueSk7XG4gICAgICAgIGluUHJvamVjdGlsZS5hbmltYXRlKFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHtlLnh9cHgsICR7ZS55fXB4KWBcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7dGFyZ2V0LnggKyAwLjUgKiB0YXJnZXQud2lkdGh9cHgsICR7dGFyZ2V0LnkgKyAwLjUgKiB0YXJnZXQuaGVpZ2h0fXB4KWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSwge1xuICAgICAgICAgICAgZHVyYXRpb246IDIwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGFyZ2V0RWxlbS5pbm5lclRleHQgPSAoMSArIHBhcnNlSW50KHRhcmdldEVsZW0uaW5uZXJUZXh0KSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGluUHJvamVjdGlsZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7dGFyZ2V0LnggKyAwLjUgKiB0YXJnZXQud2lkdGh9cHgsICR7dGFyZ2V0LnkgKyAwLjUgKiB0YXJnZXQuaGVpZ2h0fXB4KWA7XG4gICAgICAgIH0sIDIwMCk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaW5Qcm9qZWN0aWxlLnJlbW92ZSgpO1xuICAgICAgICB9LCAzMDApO1xuICAgIH1cbiAgICBjcmVhdGVPdXRQcm9qZWN0aWxlKGUpIHtcbiAgICAgICAgbGV0IHF1ZXVlT3V0VHlwZSA9IHRoaXMuZ2FtZS5nZXRNb3N0UmVjZW50bHlSZW1vdmVkRWxlbWVudCgpO1xuICAgICAgICBpZiAocXVldWVPdXRUeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG91dFByb2plY3RpbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBvdXRQcm9qZWN0aWxlLmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0aWxlXCIsIFwicmVkXCIpO1xuICAgICAgICBsZXQgdGFyZ2V0ID0gdGhpcy5xdWV1ZVRhYmxlRmllbGRzLmdldChbcXVldWVPdXRUeXBlLnN5bWJvbCwgcXVldWVPdXRUeXBlLnByaW9yaXR5XS50b1N0cmluZygpKS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgZG9jdW1lbnQuYm9keS5wcmVwZW5kKG91dFByb2plY3RpbGUpO1xuICAgICAgICBjb25zb2xlLmxvZyhlLngsIGUueSwgdGFyZ2V0LngsIHRhcmdldC55KTtcbiAgICAgICAgb3V0UHJvamVjdGlsZS5hbmltYXRlKFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHt0YXJnZXQueCArIDAuNSAqIHRhcmdldC53aWR0aH1weCwgJHt0YXJnZXQueSArIDAuNSAqIHRhcmdldC5oZWlnaHR9cHgpYFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IGB0cmFuc2xhdGUoJHtlLnh9cHgsICR7ZS55fXB4KWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSwge1xuICAgICAgICAgICAgZHVyYXRpb246IDIwMCxcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgb3V0UHJvamVjdGlsZS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlKCR7ZS54fXB4LCAke2UueX1weClgO1xuICAgICAgICB9LCAyMDApO1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIG91dFByb2plY3RpbGUucmVtb3ZlKCk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgfVxuICAgIG9uVHJhbnNpdGlvbkNsaWNrZWQoZSkge1xuICAgICAgICB0aGlzLmJ1dHRvbkNsaWNrU291bmQucGxheSgpO1xuICAgICAgICB0aGlzLmNyZWF0ZUluUHJvamVjdGlsZShlKTtcbiAgICAgICAgdGhpcy5jcmVhdGVPdXRQcm9qZWN0aWxlKGUpO1xuICAgIH1cbiAgICBvblJlc2V0KCkge1xuICAgICAgICB0aGlzLnJlc2V0U291bmQucGxheSgpO1xuICAgIH1cbiAgICBvbkFjY2VwdCgpIHtcbiAgICAgICAgdGhpcy5hY2NlcHRTb3VuZC5wbGF5KCk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWNjZXB0ZWRcIikuc2hvd01vZGFsKCk7XG4gICAgfVxuICAgIGFkZExldmVsKGxldmVsTmFtZSwgZ3JvdXAsIGlkKSB7XG4gICAgICAgIGlmICghdGhpcy5sZXZlbEdyb3Vwcy5oYXMoZ3JvdXApKSB7XG4gICAgICAgICAgICBsZXQgZ3JvdXBFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICAgICAgbGV0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoMlwiKTtcbiAgICAgICAgICAgIGhlYWRlci5pbm5lclRleHQgPSBncm91cDtcbiAgICAgICAgICAgIGdyb3VwRWxlbWVudC5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICAgICAgbGV0IGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib2xcIik7XG4gICAgICAgICAgICBncm91cEVsZW1lbnQuYXBwZW5kQ2hpbGQobGlzdCk7XG4gICAgICAgICAgICB0aGlzLmxldmVsR3JvdXBMaXN0LmFwcGVuZENoaWxkKGdyb3VwRWxlbWVudCk7XG4gICAgICAgICAgICB0aGlzLmxldmVsR3JvdXBzLnNldChncm91cCwgbGlzdCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGdyb3VwRWxlbWVudCA9IHRoaXMubGV2ZWxHcm91cHMuZ2V0KGdyb3VwKTtcbiAgICAgICAgbGV0IGxpc3RFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImxpXCIpO1xuICAgICAgICBsZXQgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgYnV0dG9uLmlubmVyVGV4dCA9IGxldmVsTmFtZTtcbiAgICAgICAgYnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7IHZhciBfYTsgKF9hID0gZ2FtZV8xLkdhbWUuaW5zdGFuY2UpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5vbkxldmVsU2VsZWN0KGlkKTsgfTtcbiAgICAgICAgbGlzdEVsZW0uYXBwZW5kQ2hpbGQoYnV0dG9uKTtcbiAgICAgICAgZ3JvdXBFbGVtZW50LmFwcGVuZENoaWxkKGxpc3RFbGVtKTtcbiAgICB9XG4gICAgc2V0UHJldk5leHQocHJldiwgbmV4dCkge1xuICAgICAgICBpZiAocHJldiA9PT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wcmV2aW91c0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnByZXZpb3VzQnV0dG9uLnZhbHVlID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMucHJldmlvdXNCdXR0b24udmFsdWUgPSBwcmV2O1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZXh0ID09PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm5leHRCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5uZXh0QnV0dG9uLnZhbHVlID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubmV4dEJ1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5uZXh0QnV0dG9uLnZhbHVlID0gbmV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRMZXZlbE5hbWUobmFtZSkge1xuICAgICAgICB0aGlzLmxldmVsVGl0bGUuaW5uZXJUZXh0ID0gbmFtZTtcbiAgICB9XG4gICAgc2V0TGV2ZWxEZXNjcmlwdGlvbihkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLmxldmVsRGVzY3JpcHRpb24uaW5uZXJIVE1MID0gZGVzY3JpcHRpb247XG4gICAgfVxufVxuZXhwb3J0cy5HYW1lVUkgPSBHYW1lVUk7XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBnYW1lXzEgPSByZXF1aXJlKFwiLi9nYW1lXCIpO1xuZnVuY3Rpb24gbWFpbigpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIGxldCBnYW1lID0gbmV3IGdhbWVfMS5HYW1lKCk7XG4gICAgKF9hID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzdGF0ZXNcIikpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGUpID0+IHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICAoX2EgPSBnYW1lXzEuR2FtZS5pbnN0YW5jZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLm9uU3RhdGVDbGlja2VkKGUpO1xuICAgIH0pO1xuICAgIChfYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic3RhdGVzXCIpKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCAoZSkgPT4ge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIChfYSA9IGdhbWVfMS5HYW1lLmluc3RhbmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Eub25TdGF0ZUhvdmVyKGUpO1xuICAgIH0pO1xufVxubWFpbigpO1xuLy8gRXhwb3NlIHRoZSBHYW1lIGNsYXNzIGZvciB1c2UgaW4gSFRNTFxuLy8gQHRzLWlnbm9yZVxud2luZG93W1wiR2FtZVwiXSA9IGdhbWVfMS5HYW1lO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9