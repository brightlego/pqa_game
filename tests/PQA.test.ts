import { PQARun } from "../src/PQA";

let singleStatePQA = (word: ('a' | 'b')[]) => new PQARun(
    [0],
    ['a', 'b'],
    [],
    0,
    new Set([0]),
    [
        {stateFrom: 0, stateTo: 0, input: 'a', queueIn: null, queueOut: null},
        {stateFrom: 0, stateTo: 0, input: 'b', queueIn: null, queueOut: null}
    ],
    word
)

let multiStatePQA =  (word: ('a' | 'b')[]) => new PQARun(
    [0, 1, 2],
    ['a', 'b'],
    [],
    0,
    new Set([0]),
    [
        {stateFrom: 0, stateTo: 1, input: 'a', queueIn: null, queueOut: null},
        {stateFrom: 0, stateTo: 1, input: 'b', queueIn: null, queueOut: null},
        {stateFrom: 1, stateTo: 2, input: 'a', queueIn: null, queueOut: null},
        {stateFrom: 1, stateTo: 2, input: 'b', queueIn: null, queueOut: null},
        {stateFrom: 2, stateTo: 0, input: 'a', queueIn: null, queueOut: null},
        {stateFrom: 2, stateTo: 0, input: 'b', queueIn: null, queueOut: null},
    ],
    word
)

let queuePQA =  (word: ('a' | 'b')[]) => new PQARun(
    [0, 1, 2],
    ['a', 'b'],
    ['x', 'y'],
    0,
    new Set([0]),
    [
        {stateFrom: 0, stateTo: 1, input: 'a', queueIn: { symbol: 'x', priority: 0 }, queueOut: null},
        {stateFrom: 0, stateTo: 1, input: 'b', queueIn: null, queueOut: { symbol: 'x', priority: 0 }},
        {stateFrom: 1, stateTo: 2, input: 'a', queueIn: { symbol: 'y', priority: 1 }, queueOut: null},
        {stateFrom: 1, stateTo: 2, input: 'b', queueIn: null, queueOut: { symbol: 'y', priority: 1 }},
        {stateFrom: 2, stateTo: 0, input: 'a', queueIn: null, queueOut: null},
        {stateFrom: 2, stateTo: 0, input: 'b', queueIn: null, queueOut: null},
    ],
    word
)


describe("Testing PQA", () => {
    test("Rejects with remaining input", () => {
        let pqa = singleStatePQA(["a", "b"])
        expect(pqa.canAccept()).toBe(false);
    })
    test("Accepts with no remaining input", () => {
        let pqa = singleStatePQA([])
        expect(pqa.canAccept()).toBe(true);
    })
})