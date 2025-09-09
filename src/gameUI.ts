import {PQARun} from "./PQA";
import {PQAData} from "./PQAData";
import {Game} from "./game";
import {StateDiagram} from "./StateDiagram";

// @ts-ignore
import buttonClickSoundResource from "./assets/sounds/219069__annabloom__click1.wav";

// @ts-ignore
import resetSoundResource from "./assets/sounds/54405__korgms2000b__button-click.wav";
// @ts-ignore
import acceptSoundResource from "./assets/sounds/66136__aji__ding30603-spedup.wav";

export class GameUI {
    stateCanvas: HTMLCanvasElement;
    hitRegionCanvas: HTMLCanvasElement;
    queueTable: HTMLTableElement;
    queueTableFields: Map<string, HTMLTableCellElement>;
    wordParagraph: HTMLParagraphElement;
    data: PQAData | null = null;
    queueHidden: boolean = false;
    buttonClickSound: HTMLAudioElement = new Audio(buttonClickSoundResource);
    resetSound: HTMLAudioElement = new Audio(resetSoundResource);
    acceptSound: HTMLAudioElement = new Audio(acceptSoundResource);
    levelTitle: HTMLHeadingElement;
    game: Game;
    previousButton: HTMLButtonElement;
    nextButton: HTMLButtonElement;
    stateDiagram: StateDiagram;
    levelGroupList: HTMLOListElement;
    levelGroups: Map<string, HTMLOListElement>;
    levelDescription: HTMLParagraphElement;


    public constructor(game: Game) {
        this.stateCanvas = document.getElementById("states") as HTMLCanvasElement;
        this.queueTable = document.getElementById("queue") as HTMLTableElement;
        this.hitRegionCanvas = document.getElementById("stateHitRegion") as HTMLCanvasElement;
        this.wordParagraph = document.getElementById("word") as HTMLParagraphElement;
        this.previousButton = document.getElementById("prev") as HTMLButtonElement;
        this.nextButton = document.getElementById("next") as HTMLButtonElement;
        this.levelTitle = document.getElementById("level_name") as HTMLHeadingElement;
        this.levelGroupList = document.getElementById("levels") as HTMLOListElement;
        this.levelDescription = document.getElementById("level_description") as HTMLParagraphElement;
        this.levelGroups = new Map();
        this.queueTableFields = new Map();
        this.game = game;
        this.stateDiagram = new StateDiagram();
        this.stateDiagram.clearCanvas();
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

    setQueueTable(data: PQAData) {
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
        this.stateDiagram.update(this.data!, state);
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
                duration: 200,
            }
        )

        setTimeout(() => {
            targetElem.innerText = (1 + parseInt(targetElem.innerText)).toString();
            inProjectile.style.transform = `translate(${target.x + 0.5*target.width}px, ${target.y + 0.5*target.height}px)`;
        }, 200);

        setTimeout(() => {
            inProjectile.remove();
        }, 300);
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
                duration: 200,
            }
        )

        setTimeout(() => {
            outProjectile.style.transform = `translate(${e.x}px, ${e.y}px)`;
        }, 200);

        setTimeout(() => {
            outProjectile.remove();
        }, 300);
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
        (document.getElementById("accepted")! as HTMLDialogElement).showModal();
    }

    public addLevel(levelName: string, group: string, id: string) {
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
        let groupElement = this.levelGroups.get(group)!;
        let listElem = document.createElement("li");
        let button = document.createElement("button");
        button.innerText = levelName;
        button.onclick = () => { Game.instance?.onLevelSelect(id) }
        listElem.appendChild(button);
        groupElement.appendChild(listElem);
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

    public setLevelDescription(description: string) {
        this.levelDescription.innerHTML = description;
    }

}