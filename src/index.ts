import {Game} from "./game";
import "./assets/style.css"
// @ts-ignore
import GithubIcon from "./assets/github-mark.svg"

function main() {
    // noinspection JSUnusedLocalSymbols
    let game = new Game();
    document.getElementById("states")?.addEventListener("click", (e: MouseEvent) => {
        Game.instance?.onStateClicked(e);
    })
    document.getElementById("states")?.addEventListener("mousemove", (e: MouseEvent) => {
        Game.instance?.onStateHover(e);
    })
    let image = new Image();
    image.src = GithubIcon;
    document.getElementById("github-icon")?.appendChild(image);
}

main()


// Expose the Game class for use in HTML
// @ts-ignore
window["Game"] = Game;
