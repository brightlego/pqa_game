import {PQAData, dataFormat} from "./PQAData";
import {GameUI} from "./gameUI";

type metadataFormat = {
    name: string,
    group: string,
    groupIndex: number,
    id: string,
}

export class LevelData {
    groups: Map<string, string[]>
    levels: Map<string, { data: PQAData, group: string, name: string, prev: string | null, next: string | null}>
    ui: GameUI

    constructor(ui: GameUI) {
        this.groups = new Map();
        this.levels = new Map();
        this.ui = ui
        this.loadLevels();
    }


    async loadLevels() {
        let {groups, levelFiles} = await window.fetch("data/levels.json").then(r => r.text()).then(r => JSON.parse(r));

        for (let file of levelFiles) {
            let rawData: string = await window.fetch(`data/${file}`)
                .then(r => r.text());
            let parsedData = JSON.parse(rawData) as dataFormat & {"metadata": metadataFormat};
            let pqaData = new PQAData(parsedData);
            let name = parsedData.metadata.name.toString();
            let group = parsedData.metadata.group.toString();
            let id = parsedData.metadata.id.toString();
            if (!this.groups.has(group)) {
                this.groups.set(group, []);
            }
            let index: number = parsedData.metadata.groupIndex;
            this.groups.get(group)![index] = id;
            this.levels.set(id, { data: pqaData, group, name, prev: null, next: null});

        }

        for ( let [groupName, ids] of this.groups) {
            let compressedIds = ids.filter(id => id !== undefined);
            this.groups.set(groupName, compressedIds);
        }

        let prevId: string | null = null;
        let currId: string | null = null;
        for (let groupName of groups) {
            let group = this.groups.get(groupName);
            if (group === undefined) { continue; }
            for (let id of group) {
                if (id === undefined) { continue; }
                if (currId !== null) {
                    this.levels.get(currId)!.next = id;
                    this.levels.get(currId)!.prev = prevId;
                }
                prevId = currId;
                currId = id;
            }
        }
        if (currId !== null) {
            this.levels.get(currId)!.next = null;
            this.levels.get(currId)!.prev = prevId;
        }

        for (let groupName of groups) {
            let group = this.groups.get(groupName);
            if (group === undefined) { continue; }
            for (let id of group) {
                if (id === undefined) { continue; }
                let { group, name } = this.levels.get(id)!;
                this.ui.addLevel(name, group, id);
            }
        }
    }

    public getLevelData(id: string): PQAData {
        return this.levels.get(id)!.data;
    }

    public getPrevious(id: string): string | null {
        return this.levels.get(id)!.prev;
    }

    public getNext(id: string): string | null {
        return this.levels.get(id)!.next;
    }

    public getName(id: string): string {
        return this.levels.get(id)!.name;
    }
}