import {Game} from "./game";
import {PQAData} from "./PQAData";

let data: Map<string, PQAData> = new Map();

async function loadData() {
    let test1 = await window.fetch("data/test1.json")
        .then(r => r.text())
        .then(value => new PQAData(value));
    data.set("test1", test1);
}

function main() {
    let game = new Game();
    document.getElementById("states")?.addEventListener("click", (e: MouseEvent) => {
        Game.instance?.onStateClicked(e);
    })
    document.getElementById("states")?.addEventListener("mousemove", (e: MouseEvent) => {
        Game.instance?.onStateHover(e);
    })
    game.loadPQA(data.get("test1")!);
}

loadData().then(main);


// Expose the Game class for use in HTML
// @ts-ignore
window["Game"] = Game;
