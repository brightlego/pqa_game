import {PQARun, Transition} from "./PQA";
import {PQAData} from "./PQAData";
import {Game} from "./game";

function toHexCode(n: number): string {
    return `#${n.toString(16).padStart(6, "0")}`;
}

export class GameUI {
    stateCanvas: HTMLCanvasElement;
    hitRegionCanvas: HTMLCanvasElement;
    queueTable: HTMLTableElement;
    queueTableFields: Map<string, HTMLTableCellElement>;
    wordParagraph: HTMLParagraphElement;
    data: PQAData | null = null;
    queueHidden: boolean = false;
    buttonClickSound: HTMLAudioElement = new Audio("sounds/219069__annabloom__click1.wav");
    resetSound: HTMLAudioElement = new Audio("sounds/54405__korgms2000b__button-click.wav");
    acceptSound: HTMLAudioElement = new Audio("sounds/66136__aji__ding30603-spedup.wav");
    levelTitle: HTMLHeadingElement;
    game: Game;
    levelSelect: HTMLSelectElement;
    levelSelectGroups: Map<string, HTMLOptGroupElement>;
    previousButton: HTMLButtonElement;
    nextButton: HTMLButtonElement;


    public constructor(game: Game) {
        this.stateCanvas = document.getElementById("states") as HTMLCanvasElement;
        this.queueTable = document.getElementById("queue") as HTMLTableElement;
        this.hitRegionCanvas = document.getElementById("stateHitRegion") as HTMLCanvasElement;
        this.wordParagraph = document.getElementById("word") as HTMLParagraphElement;
        this.levelSelect = document.getElementById("level_select") as HTMLSelectElement;
        this.previousButton = document.getElementById("prev") as HTMLButtonElement;
        this.nextButton = document.getElementById("next") as HTMLButtonElement;
        this.levelTitle = document.getElementById("level_name") as HTMLHeadingElement;
        this.levelSelectGroups = new Map();
        this.queueTableFields = new Map();
        this.game = game;
        this.clearCanvas();
    }

    public setPQA(pqa: PQARun<string, string, string>) {
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

    public clearCanvas() {
        let context = this.stateCanvas.getContext("2d")!;
        let hitContext = this.hitRegionCanvas.getContext("2d")!;
        context.clearRect(0, 0, this.stateCanvas.width, this.stateCanvas.height);
        hitContext.clearRect(0, 0, this.hitRegionCanvas.width, this.hitRegionCanvas.height);
        context.fillStyle = "white";
        hitContext.fillStyle = "white";
        context.fillRect(0, 0, this.stateCanvas.width, this.stateCanvas.height);
        hitContext.fillRect(0, 0, this.hitRegionCanvas.width, this.hitRegionCanvas.height);
    }

    public getTransitionIdx(event: MouseEvent): number {
        let x = event.offsetX
        let y = event.offsetY
        let context = this.hitRegionCanvas.getContext("2d")!;
        let hitRegion = context.getImageData(x, y, 1, 1).data;
        return hitRegion[0]*256*256 + hitRegion[1]*256 + hitRegion[2];
    }

    public onStateHover(event: MouseEvent, game: Game) {
        let x = event.offsetX;
        let y = event.offsetY;
        let context = this.hitRegionCanvas.getContext("2d")!;
        let hitRegion = context.getImageData(x, y, 1, 1).data;

        if (hitRegion[0] < 0x60) {
            if (game.canRunTransition(this.getTransitionIdx(event))) {
                this.stateCanvas.style.cursor = "pointer";
            } else {
                this.stateCanvas.style.cursor = "not-allowed";
            }
        } else {
            this.stateCanvas.style.cursor = "default";
        }
    }

    // Taken from https://stackoverflow.com/questions/808826/drawing-an-arrow-using-html-canvas
    canvas_arrow(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
        let headlen = 10; // length of head in pixels
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

    displayTransition(transition: Transition<string, string, string>) {
        let result = "";
        if (transition.input === null) {
            result += 'ε'
        } else {
            result += transition.input;
        }

        if (this.queueHidden) {
            return result;
        }

        result += " : ";

        if (transition.queueOut === null) {
            result += '∅'
        } else {
            result += `(${transition.queueOut.symbol}, ${transition.queueOut.priority})`;
        }

        result += " ↦ "

        if (transition.queueIn === null) {
            result += '∅'
        } else {
            result += `(${transition.queueIn.symbol}, ${transition.queueIn.priority})`;
        }

        return result
    }

    drawTransitions(data: PQAData) {
        let context = this.stateCanvas.getContext("2d")!;
        let hitContext = this.hitRegionCanvas.getContext("2d")!;
        let transitionIndex = 0;
        context.strokeStyle = "black";

        for (let {transition, path, labelPosition} of data.transitions) {
            context.lineWidth = 6;
            context.beginPath();
            for (let {x, y} of path) {
                context.lineTo(x, y);
            }
            context.stroke();
            context.closePath();
            this.canvas_arrow(context, path[path.length - 2].x, path[path.length - 2].y, path[path.length - 1].x, path[path.length - 1].y);

            context.fillStyle = "black";
            context.font = "16px Arial";
            context.textAlign = "left";
            context.textBaseline = "middle";

            context.fillText(this.displayTransition(transition), labelPosition.x, labelPosition.y);

            hitContext.lineWidth = 15;
            hitContext.strokeStyle = toHexCode(transitionIndex);
            hitContext.beginPath();
            for (let {x, y} of path) {
                hitContext.lineTo(x, y);
            }
            hitContext.stroke();
            hitContext.closePath();
            transitionIndex += 1;
        }
    }


    drawStates(activeState: string, data: PQAData) {
        let context = this.stateCanvas.getContext("2d")!;
        for (let [state, {position, isAccepting}] of data.states) {
            if (state === activeState) {
                context.fillStyle = "yellow"
                context.strokeStyle = "red";
            } else {
                context.fillStyle = "white";
                context.strokeStyle = "black";
            }
            context.lineWidth = 2;
            context.beginPath();
            context.arc(position.x, position.y, 30, 0, 2*Math.PI);
            context.fill();
            context.stroke();
            context.closePath();

            context.beginPath();
            if (isAccepting) {
                context.arc(position.x, position.y, 25, 0, 2*Math.PI);
                context.stroke();
            }
            context.closePath();

            context.fillStyle = "black";
            context.font = "16px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(state, position.x, position.y);
        }
    }




    setQueueTable(data: PQAData) {
        if (data.queueHidden) {
            this.queueTable.hidden = true;
            this.queueHidden = true;
            return;
        }
        this.queueTable.hidden = false;
        this.queueHidden = false;
        this.queueTable.innerHTML = "";
        this.setQueueTableHead(data);
        this.setQueueTableBody(data);
    }

    setQueueTableHead(data: PQAData) {
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

    setQueueTableBody(data: PQAData) {
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



    public updatePriorityQueue(queue: Iterable<{ symbol: string, priority: number, count: number }>) {
        if (this.queueTable.hidden) { return; }
        for (let {symbol, priority, count} of queue) {
            if (count === 0) {
                this.queueTableFields.get([symbol, priority].toString())!.innerText = "";
            } else {
                this.queueTableFields.get([symbol, priority].toString())!.innerText = count.toString();
            }
        }
    }


    public showError(message: String) {
        console.log(message);
    }

    public setActiveState(state: string) {
        this.clearCanvas();
        this.drawTransitions(this.data!);
        this.drawStates(state, this.data!);
    }

    public updateWord(word: string[]) {
        this.wordParagraph.innerText = word.join(" ");
    }

    createInProjectile(e: MouseEvent) {
        let queueInType = this.game.getMostRecentlyAddedElement();
        if (queueInType === null) { return; }
        let inProjectile = document.createElement("div");
        inProjectile.classList.add("projectile", "red");
        let targetElem = this.queueTableFields.get([queueInType.symbol, queueInType.priority].toString())!;
        targetElem.innerText = (parseInt(targetElem.innerText) - 1).toString();
        let target = targetElem.getBoundingClientRect();
        document.body.prepend(inProjectile);
        console.log(e.x, e.y, target.x, target.y);
        inProjectile.animate(
            [
                {
                    transform: `translate(${e.x}px, ${e.y}px)`
                },
                {
                    transform: `translate(${target.x + 0.5*target.width}px, ${target.y + 0.5*target.height}px)`
                }
            ],
            {
                duration: 500,
            }
        )

        setTimeout(() => {
            targetElem.innerText = (1 + parseInt(targetElem.innerText)).toString();
        }, 500);

        setTimeout(() => {
            inProjectile.remove();
        }, 1000);
    }

    createOutProjectile(e: MouseEvent) {
        let queueOutType = this.game.getMostRecentlyRemovedElement();
        if (queueOutType === null) { return; }
        let outProjectile = document.createElement("div");
        outProjectile.classList.add("projectile", "red");
        let target = this.queueTableFields.get([queueOutType.symbol, queueOutType.priority].toString())!.getBoundingClientRect();
        document.body.prepend(outProjectile);
        console.log(e.x, e.y, target.x, target.y);
        outProjectile.animate(
            [
                {
                    transform: `translate(${target.x + 0.5*target.width}px, ${target.y + 0.5*target.height}px)`
                },
                {
                    transform: `translate(${e.x}px, ${e.y}px)`
                }
            ],
            {
                duration: 500,
            }
        )

        setTimeout(() => {
            outProjectile.remove();
        }, 1000);
    }


    public onTransitionClicked(e: MouseEvent) {
        this.buttonClickSound.play();
        this.createInProjectile(e);
        this.createOutProjectile(e);
    }

    public onReset() {
        this.resetSound.play();
    }

    public onAccept() {
        this.acceptSound.play();
        document.getElementById("accepted")!.hidden = false;
    }

    public addLevel(levelName: string, group: string, id: string) {
        if (!this.levelSelectGroups.has(group)) {
            let groupElement = document.createElement("optgroup");
            groupElement.label = group;
            this.levelSelect.appendChild(groupElement);
            this.levelSelectGroups.set(group, groupElement);
        }
        let groupElement = this.levelSelectGroups.get(group)!;
        let option: HTMLOptionElement = document.createElement("option");
        option.value = id;
        option.innerText = levelName;
        groupElement.appendChild(option);
    }

    public setPrevNext(prev: string | null, next: string | null) {
        if (prev === null) {
            this.previousButton.disabled = true;
            this.previousButton.value = "";
        } else {
            this.previousButton.disabled = false;
            this.previousButton.value = prev;
        }

        if (next === null) {
            this.nextButton.disabled = true;
            this.nextButton.value = "";
        } else {
            this.nextButton.disabled = false;
            this.nextButton.value = next;
        }
    }

    public setLevelName(name: string) {
        this.levelTitle.innerText = name;
    }

}