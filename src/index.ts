import {Game} from "./game";
import "./assets/style.css"

function main() {
    let game = new Game();
    document.getElementById("states")?.addEventListener("click", (e: MouseEvent) => {
        Game.instance?.onStateClicked(e);
    })
    document.getElementById("states")?.addEventListener("mousemove", (e: MouseEvent) => {
        Game.instance?.onStateHover(e);
    })
}

main()


// Expose the Game class for use in HTML
// @ts-ignore
window["Game"] = Game;
