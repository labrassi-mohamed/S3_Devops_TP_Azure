"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tl = require("azure-pipelines-task-lib/task");
function run(connection, outputUpdate) {
    let args = tl.getInput("arguments");
    if (args) {
        tl.warning(tl.loc('IgnoringArgumentsInput'));
    }
    let dockerbuild = require("./dockerbuild");
    let dockerpush = require("./dockerpush");
    let outputPaths = "";
    let promise = dockerbuild.run(connection, (outputPath) => outputPaths += outputPath, true).then(() => {
        return dockerpush.run(connection, (outputPath) => outputPaths += ("\n" + outputPath), true).then(() => {
            outputUpdate(outputPaths);
        });
    });
    return promise;
}
exports.run = run;
