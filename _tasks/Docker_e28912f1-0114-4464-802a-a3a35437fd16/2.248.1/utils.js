"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTaskOutput = void 0;
const tl = require("azure-pipelines-task-lib/task");
const fs = require("fs");
const os = require("os");
const path = require("path");
const fileutils = require("azure-pipelines-tasks-docker-common/fileutils");
function getTaskOutputDir(command) {
    let tempDirectory = tl.getVariable('agent.tempDirectory') || os.tmpdir();
    let taskOutputDir = path.join(tempDirectory, "task_outputs");
    return taskOutputDir;
}
function writeTaskOutput(commandName, output) {
    let taskOutputDir = getTaskOutputDir(commandName);
    if (!fs.existsSync(taskOutputDir)) {
        fs.mkdirSync(taskOutputDir);
    }
    let outputFileName = commandName + "_" + Date.now() + ".txt";
    let taskOutputPath = path.join(taskOutputDir, outputFileName);
    if (fileutils.writeFileSync(taskOutputPath, output) == 0) {
        tl.warning(tl.loc('NoDataWrittenOnFile', taskOutputPath));
    }
    return taskOutputPath;
}
exports.writeTaskOutput = writeTaskOutput;
