"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const tl = require("azure-pipelines-task-lib/task");
const containerconnection_1 = require("azure-pipelines-tasks-docker-common/containerconnection");
const registryauthenticationtoken_1 = require("azure-pipelines-tasks-docker-common/registryauthenticationprovider/registryauthenticationtoken");
tl.setResourcePath(path.join(__dirname, 'task.json'));
let registryAuthenticationToken;
let endpointId = tl.getInput("containerRegistry");
function getToken() {
    return __awaiter(this, void 0, void 0, function* () {
        registryAuthenticationToken = yield (0, registryauthenticationtoken_1.getDockerRegistryEndpointAuthenticationToken)(endpointId);
    });
}
getToken().then((val) => {
    // Take the specified command
    let command = tl.getInput("command", true).toLowerCase();
    let isLogout = (command === "logout");
    let isLogin = (command === "login");
    const isDockerRequired = !isLogin && !isLogout;
    // Connect to any specified container registry
    let connection = new containerconnection_1.default(isDockerRequired);
    connection.open(null, registryAuthenticationToken, true, isLogout);
    let dockerCommandMap = {
        "buildandpush": "./dockerbuildandpush",
        "build": "./dockerbuild",
        "push": "./dockerpush",
        "login": "./dockerlogin",
        "logout": "./dockerlogout",
        "start": "./dockerlifecycle",
        "stop": "./dockerlifecycle"
    };
    let authType;
    try {
        tl.debug("Attempting to get endpoint authorization scheme...");
        authType = tl.getEndpointAuthorizationScheme(endpointId, false);
    }
    catch (error) {
        tl.debug("Failed to get endpoint authorization scheme.");
    }
    if (!authType) {
        try {
            tl.debug("Attempting to get endpoint authorization scheme as an authorization parameter...");
            authType = tl.getEndpointAuthorizationParameter(endpointId, "scheme", false);
        }
        catch (error) {
            tl.debug("Failed to get endpoint authorization scheme as an authorization parameter. Will default authorization scheme to ServicePrincipal.");
            authType = "ServicePrincipal";
        }
    }
    let telemetry = {
        command: command,
        jobId: tl.getVariable('SYSTEM_JOBID'),
        scheme: authType
    };
    console.log("##vso[telemetry.publish area=%s;feature=%s]%s", "TaskEndpointId", "DockerV2", JSON.stringify(telemetry));
    /* tslint:disable:no-var-requires */
    let commandImplementation = require("./dockercommand");
    if (command in dockerCommandMap) {
        commandImplementation = require(dockerCommandMap[command]);
    }
    let resultPaths = "";
    commandImplementation.run(connection, (pathToResult) => {
        resultPaths += pathToResult;
    })
        /* tslint:enable:no-var-requires */
        .fin(function cleanup() {
        if (command !== "login") {
            connection.close(true, command);
        }
    })
        .then(function success() {
        tl.setVariable("DockerOutput", resultPaths);
        tl.setResult(tl.TaskResult.Succeeded, "");
    }, function failure(err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    })
        .done();
});
