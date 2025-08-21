import {Transition} from "./PQA";
import {PQAData} from "./PQAData";

function toHexCode(n: number): string {
    return `#${n.toString(16).padStart(6, "0")}`;
}

export class StateDiagram {
    stateCanvas: HTMLCanvasElement;
    hitRegionCanvas: HTMLCanvasElement;
    queueHidden: boolean = false;
    scale: number = 1.0;
    lastUpdateInfo: { data: PQAData, activeState: string } | null = null;

    public constructor() {
        this.stateCanvas = document.getElementById("states") as HTMLCanvasElement;
        this.hitRegionCanvas = document.getElementById("stateHitRegion") as HTMLCanvasElement;
        this.updateScale()
        window.onresize = () => {
            this.update(null, null)
        }
    }

    updateScale() {
        this.scale = (this.stateCanvas.getBoundingClientRect().width - 4) / 700; // It was initially 700px so we are now stuck with this as a baseline
        // this.stateCanvas.height = 500 * this.scale;
        this.stateCanvas.width = 700 * this.scale;
        this.stateCanvas.height = 500 * this.scale;
        this.stateCanvas.style.height = `${500/700 * (this.stateCanvas.getBoundingClientRect().width - 4)}px`;
        this.hitRegionCanvas.height = 500 * this.scale;
        this.hitRegionCanvas.width = 700 * this.scale;
    }

    public update(pqaData: PQAData | null, activeState: string | null) {
        this.updateScale();
        if (pqaData === null || activeState === null) {
            if (this.lastUpdateInfo !== null) {
                pqaData = this.lastUpdateInfo.data;
                activeState = this.lastUpdateInfo.activeState;
            } else {
                return;
            }
        }
        this.clearCanvas();
        this.drawTransitions(pqaData);
        this.drawStates(activeState, pqaData);
        this.lastUpdateInfo = { data: pqaData, activeState: activeState };
    }

    xTransform(x: number): number {
        return x * this.scale;
    }

    yTransform(y: number): number {
        return y * this.scale;
    }

    public setQueueHidden(queueHidden: boolean) {
        this.queueHidden = queueHidden;
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

    // Taken from https://stackoverflow.com/questions/808826/drawing-an-arrow-using-html-canvas
    canvas_arrow(context: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number) {
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
            context.lineWidth = 6 * this.scale;
            context.beginPath();
            for (let {x, y} of path) {
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
            for (let {x, y} of path) {
                hitContext.lineTo(this.xTransform(x), this.yTransform(y));
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
            context.lineWidth = 2 * this.scale;
            context.beginPath();
            context.arc(this.xTransform(position.x), this.yTransform(position.y), 30 * this.scale, 0, 2*Math.PI);
            context.fill();
            context.stroke();
            context.closePath();

            context.beginPath();
            if (isAccepting) {
                context.arc(this.xTransform(position.x), this.yTransform(position.y), 25 * this.scale, 0, 2*Math.PI);
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