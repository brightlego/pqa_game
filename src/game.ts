import {PQARun} from "./PQA";
import {PQAData} from "./PQAData";
import {GameUI} from "./gameUI";

export class Game {
    pqa: PQARun<string, string, string> | null;
    ui: GameUI;
    static instance: Game | null = null;

    constructor() {
        this.ui = new GameUI(this);
        this.pqa = null;
        Game.instance = this;
    }


    
    public loadPQA(pqaData: PQAData) {
        this.pqa = pqaData.createPQA();
        this.ui.setPQA(this.pqa);
    }

    public onStateHover(e: MouseEvent) {
        this.ui.onStateHover(e, this);
    }

    public onStateClicked(e: MouseEvent) {
        let transitionIdx = this.ui.getTransitionIdx(e);
        if (transitionIdx >= 0x600000) {
            return;
        }
        if (this.tryRunTransition(transitionIdx)) {
            this.ui.onTransitionClicked(e);
        }
        this.onStateHover(e);

        if (this.pqa?.canAccept()) {
            this.ui.onAccept();
        }
    }

    tryRunTransition(transitionIdx: number): boolean {
        let pqa: PQARun<string, string, string>;
        if (this.pqa === null) {
            this.ui.showError("No PQA loaded");
            return false;
        } else {
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

    canRunTransition(transitionIdx: number): boolean {
        let pqa: PQARun<string, string, string>;
        if (this.pqa === null) {
            return false;
        } else {
            pqa = this.pqa;
        }
        return pqa.canRunTransition(transitionIdx)
    }

    public resetCurrentPQA() {
        let data = this.pqa?.originData;
        if (data !== null && data !== undefined) {
            this.loadPQA(data);
        }
        this.ui.onReset();
    }

    public getMostRecentlyAddedElement(): { symbol: string; priority: number } | null {
        if (this.pqa === null) {
            return null;
        }
        return this.pqa.getMostRecentlyAddedElement()
    }

    public getMostRecentlyRemovedElement(): { symbol: string; priority: number } | null {
        if (this.pqa === null) {
            return null;
        }
        return this.pqa.getMostRecentlyRemovedElement()
    }
}


