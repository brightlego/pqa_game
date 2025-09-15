import path from "path";
import fs from "fs";

import showdown from "showdown";
const converter = new showdown.Converter({"strikethrough": true, "tables": true});


export function buildLevels(dirname) {
    let dataDir = path.resolve(dirname, "data");
    let levelsDir = path.resolve(dirname, "data", "levels");
    let distDir = path.resolve(dirname, "src", "assets");

    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    let levels =  fs.readdirSync(levelsDir)

    let resultingObj = {levels: []};
    for (let level of levels) {
        let levelData = fs.readFileSync(path.resolve(levelsDir, level), "utf-8");
        resultingObj.levels.push(parseLevel(levelData, dirname));
    }

    let groups = fs.readFileSync(path.resolve(dataDir, "groups.json"), "utf-8");
    resultingObj.groups = JSON.parse(groups);

    fs.writeFileSync(path.resolve(distDir, "levels.json"), JSON.stringify(resultingObj));
    console.log(`${levels.length} levels written to ${path.resolve(distDir, "levels.json")}`)
}

function parseLevel(levelData, dirname) {
    let data = JSON.parse(levelData);
    // noinspection JSUnresolvedReference
    let descriptionPath = data.metadata.descriptionPath;
    if (descriptionPath !== undefined) {
        let description = fs.readFileSync(path.resolve(dirname, "data", "descriptions", descriptionPath), "utf-8");
        description = converter.makeHtml(description);
        data.metadata.description = description;
        data.metadata.descriptionPath = undefined;
    }
    return data
}