"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tl = require("azure-pipelines-task-lib/task");
const dockerCommandUtils = require("azure-pipelines-tasks-docker-common/dockercommandutils");
const fileUtils = require("azure-pipelines-tasks-docker-common/fileutils");
const pipelineUtils = require("azure-pipelines-tasks-docker-common/pipelineutils");
const containerImageUtils = require("azure-pipelines-tasks-docker-common/containerimageutils");
const utils = require("./utils");
function run(connection, outputUpdate, isBuildAndPushCommand) {
    // find dockerfile path
    let dockerfilepath = tl.getInput("Dockerfile", true);
    let dockerFile = fileUtils.findDockerFile(dockerfilepath);
    if (!tl.exist(dockerFile)) {
        throw new Error(tl.loc('ContainerDockerFileNotFound', dockerfilepath));
    }
    // get command arguments
    // ignore the arguments input if the command is buildAndPush, as it is ambiguous
    let commandArguments = isBuildAndPushCommand ? "" : dockerCommandUtils.getCommandArguments(tl.getInput("arguments", false));
    // get qualified image names by combining container registry(s) and repository
    let repositoryName = tl.getInput("repository");
    let imageNames = [];
    // if container registry is provided, use that
    // else, use the currently logged in registries
    if (tl.getInput("containerRegistry")) {
        let imageName = connection.getQualifiedImageName(repositoryName, true);
        if (imageName) {
            imageNames.push(imageName);
        }
    }
    else {
        imageNames = connection.getQualifiedImageNamesFromConfig(repositoryName, true);
    }
    const addPipelineData = tl.getBoolInput("addPipelineData");
    const addBaseImageInfo = tl.getBoolInput("addBaseImageData");
    // get label arguments
    let labelArguments = pipelineUtils.getDefaultLabels(addPipelineData, addBaseImageInfo, dockerFile, connection);
    // get tags input
    let tagsInput = tl.getInput("tags");
    let tags = tagsInput ? tagsInput.split(/[\n,]+/) : [];
    let tagArguments = [];
    // find all the tag arguments to be added to the command
    if (imageNames && imageNames.length > 0) {
        imageNames.forEach(imageName => {
            if (tags && tags.length > 0) {
                tags.forEach(tag => {
                    if (tag) {
                        tagArguments.push(imageName + ":" + tag);
                    }
                });
            }
            else {
                // pass just the imageName and not the tag. This will tag the image with latest tag as per the default behavior of the build command.
                tagArguments.push(imageName);
            }
        });
    }
    else {
        tl.debug(tl.loc('NotAddingAnyTagsToBuild'));
    }
    let output = "";
    return dockerCommandUtils.build(connection, dockerFile, commandArguments, labelArguments, tagArguments, (data) => output += data).then(() => {
        let taskOutputPath = utils.writeTaskOutput("build", output);
        outputUpdate(taskOutputPath);
        const builtImageId = containerImageUtils.getImageIdFromBuildOutput(output);
        if (builtImageId) {
            containerImageUtils.shareBuiltImageId(builtImageId);
        }
    });
}
exports.run = run;
