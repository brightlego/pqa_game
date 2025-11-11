import {PQARun} from "./PQA";
import {PQAData} from "./PQAData";
import {GameUI} from "./gameUI";
import {LevelData} from "./LevelData";

export class Game {
    pqa: PQARun<string, string, string> | null;
    ui: GameUI;
    levelData: LevelData;
    static instance: Game | null = null;
    hasAccepted: boolean;
    nextLevel: string | null = null;

    constructor() {
        this.ui = new GameUI(this);
        this.levelData = new LevelData(this.ui);
        this.pqa = null;
        Game.instance = this;
        this.hasAccepted = false;
    }

    public loadPQA(pqaData: PQAData, showDialog: boolean = true) {
        this.pqa = pqaData.createPQA();
        this.hasAccepted = false;
        this.ui.setPQA(this.pqa, showDialog);
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

        if (this.pqa?.canAccept() && !this.hasAccepted) {
            this.ui.onAccept();

            if (this.nextLevel !== null) {
                this.levelData.unlockLevel(this.nextLevel)
            }

            this.hasAccepted = true;
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
            this.loadPQA(data, false);
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

    public onLevelSelect(value: string) {
        if (value === "") { return; }
        let data = this.levelData.getLevelData(value);
        let prev = this.levelData.getPrevious(value);
        let next = this.levelData.getNext(value);
        let name = this.levelData.getName(value);
        let description = this.levelData.getLevelDescription(value);
        this.ui.setPrevNext(prev, next);
        this.nextLevel = next;
        this.ui.setLevelName(name);
        this.ui.setLevelDescription(description);
        this.ui.setCurrentLevel(value);
        this.loadPQA(data);
    }

    public resetProgress() {
        localStorage.removeItem("unlockedLevels");
        window.location.reload();
    }
}


