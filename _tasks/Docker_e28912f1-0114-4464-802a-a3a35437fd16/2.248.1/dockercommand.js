"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tl = require("azure-pipelines-task-lib/task");
const dockerCommandUtils = require("azure-pipelines-tasks-docker-common/dockercommandutils");
const utils = require("./utils");
function run(connection, outputUpdate) {
    let output = "";
    let dockerCommand = tl.getInput("command", true);
    let commandArguments = dockerCommandUtils.getCommandArguments(tl.getInput("arguments", false));
    return dockerCommandUtils.command(connection, dockerCommand, commandArguments, (data) => output += data).then(() => {
        let taskOutputPath = utils.writeTaskOutput(dockerCommand, output);
        outputUpdate(taskOutputPath);
    });
}
exports.run = run;
