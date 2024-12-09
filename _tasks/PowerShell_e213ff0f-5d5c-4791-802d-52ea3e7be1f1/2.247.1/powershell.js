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
const fs = require("fs");
const path = require("path");
const os = require("os");
const tl = require("azure-pipelines-task-lib/task");
const helpers_1 = require("./helpers");
const errors_1 = require("./errors");
const telemetry_1 = require("azure-pipelines-tasks-utility-common/telemetry");
var uuidV4 = require('uuid/v4');
function getActionPreference(vstsInputName, defaultAction = 'Default', validActions = ['Default', 'Stop', 'Continue', 'SilentlyContinue']) {
    let result = tl.getInput(vstsInputName, false) || defaultAction;
    if (validActions.map(actionPreference => actionPreference.toUpperCase()).indexOf(result.toUpperCase()) < 0) {
        throw new Error(tl.loc('JS_InvalidActionPreference', vstsInputName, result, validActions.join(', ')));
    }
    return result;
}
function run() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            tl.setResourcePath(path.join(__dirname, 'task.json'));
            // Get inputs.
            let input_errorActionPreference = getActionPreference('errorActionPreference', 'Stop');
            let input_warningPreference = getActionPreference('warningPreference', 'Default');
            let input_informationPreference = getActionPreference('informationPreference', 'Default');
            let input_verbosePreference = getActionPreference('verbosePreference', 'Default');
            let input_debugPreference = getActionPreference('debugPreference', 'Default');
            let input_progressPreference = getActionPreference('progressPreference', 'SilentlyContinue');
            let input_showWarnings = tl.getBoolInput('showWarnings', false);
            let input_failOnStderr = tl.getBoolInput('failOnStderr', false);
            let input_ignoreLASTEXITCODE = tl.getBoolInput('ignoreLASTEXITCODE', false);
            let input_workingDirectory = tl.getPathInput('workingDirectory', /*required*/ true, /*check*/ true);
            let input_filePath;
            let input_arguments;
            let input_script;
            let input_targetType = tl.getInput('targetType') || '';
            if (input_targetType.toUpperCase() == 'FILEPATH') {
                input_filePath = tl.getPathInput('filePath', /*required*/ true);
                if (!tl.stats(input_filePath).isFile() || !input_filePath.toUpperCase().match(/\.PS1$/)) {
                    throw new Error(tl.loc('JS_InvalidFilePath', input_filePath));
                }
                input_arguments = tl.getInput('arguments') || '';
            }
            else if (input_targetType.toUpperCase() == 'INLINE') {
                input_script = tl.getInput('script', false) || '';
            }
            else {
                throw new Error(tl.loc('JS_InvalidTargetType', input_targetType));
            }
            const input_runScriptInSeparateScope = tl.getBoolInput('runScriptInSeparateScope');
            // Generate the script contents.
            console.log(tl.loc('GeneratingScript'));
            let contents = [];
            if (input_errorActionPreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$ErrorActionPreference = '${input_errorActionPreference}'`);
            }
            if (input_warningPreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$WarningPreference = '${input_warningPreference}'`);
            }
            if (input_informationPreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$InformationPreference = '${input_informationPreference}'`);
            }
            if (input_verbosePreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$VerbosePreference = '${input_verbosePreference}'`);
            }
            if (input_debugPreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$DebugPreference = '${input_debugPreference}'`);
            }
            if (input_progressPreference.toUpperCase() != 'DEFAULT') {
                contents.push(`$ProgressPreference = '${input_progressPreference}'`);
            }
            let script = '';
            if (input_targetType.toUpperCase() == 'FILEPATH') {
                try {
                    (0, helpers_1.validateFileArgs)(input_arguments);
                }
                catch (error) {
                    if (error instanceof errors_1.ArgsSanitizingError) {
                        throw error;
                    }
                    (0, telemetry_1.emitTelemetry)('TaskHub', 'PowerShellV2', {
                        UnexpectedError: (_b = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : JSON.stringify(error)) !== null && _b !== void 0 ? _b : null,
                        ErrorStackTrace: (_c = error === null || error === void 0 ? void 0 : error.stack) !== null && _c !== void 0 ? _c : null
                    });
                }
                script = `. '${input_filePath.replace(/'/g, "''")}' ${input_arguments}`.trim();
            }
            else {
                script = `${input_script}`;
            }
            if (input_showWarnings) {
                script = `
                $warnings = New-Object System.Collections.ObjectModel.ObservableCollection[System.Management.Automation.WarningRecord];
                Register-ObjectEvent -InputObject $warnings -EventName CollectionChanged -Action {
                    if($Event.SourceEventArgs.Action -like "Add"){
                        $Event.SourceEventArgs.NewItems | ForEach-Object {
                            Write-Host "##vso[task.logissue type=warning;]$_";
                        }
                    }
                };
                Invoke-Command {${script}} -WarningVariable +warnings;
            `;
            }
            contents.push(script);
            // log with detail to avoid a warning output.
            tl.logDetail(uuidV4(), tl.loc('JS_FormattedCommand', script), null, 'command', 'command', 0);
            if (!input_ignoreLASTEXITCODE) {
                contents.push(`if (!(Test-Path -LiteralPath variable:\LASTEXITCODE)) {`);
                contents.push(`    Write-Host '##vso[task.debug]$LASTEXITCODE is not set.'`);
                contents.push(`} else {`);
                contents.push(`    Write-Host ('##vso[task.debug]$LASTEXITCODE: {0}' -f $LASTEXITCODE)`);
                contents.push(`    exit $LASTEXITCODE`);
                contents.push(`}`);
            }
            // Write the script to disk.
            tl.assertAgent('2.115.0');
            let tempDirectory = tl.getVariable('agent.tempDirectory');
            tl.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
            let filePath = path.join(tempDirectory, uuidV4() + '.ps1');
            fs.writeFileSync(filePath, '\ufeff' + contents.join(os.EOL), // Prepend the Unicode BOM character.
            { encoding: 'utf8' }); // Since UTF8 encoding is specified, node will
            //                                    // encode the BOM into its UTF8 binary sequence.
            // Run the script.
            //
            // Note, prefer "pwsh" over "powershell". At some point we can remove support for "powershell".
            //
            // Note, use "-Command" instead of "-File" to match the Windows implementation. Refer to
            // comment on Windows implementation for an explanation why "-Command" is preferred.
            console.log('========================== Starting Command Output ===========================');
            const executionOperator = input_runScriptInSeparateScope ? '&' : '.';
            let powershell = tl.tool(tl.which('pwsh') || tl.which('powershell') || tl.which('pwsh', true))
                .arg('-NoLogo')
                .arg('-NoProfile')
                .arg('-NonInteractive')
                .arg('-Command')
                .arg(`${executionOperator} '${filePath.replace(/'/g, "''")}'`);
            let options = {
                cwd: input_workingDirectory,
                failOnStdErr: false,
                errStream: process.stdout,
                outStream: process.stdout,
                ignoreReturnCode: true
            };
            // Listen for stderr.
            let stderrFailure = false;
            const aggregatedStderr = [];
            if (input_failOnStderr) {
                powershell.on('stderr', (data) => {
                    stderrFailure = true;
                    aggregatedStderr.push(data.toString('utf8'));
                });
            }
            // Run bash.
            let exitCode = yield powershell.exec(options);
            // Fail on exit code.
            if (exitCode !== 0) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('JS_ExitCode', exitCode));
            }
            // Fail on stderr.
            if (stderrFailure) {
                tl.setResult(tl.TaskResult.Failed, tl.loc('JS_Stderr'));
                aggregatedStderr.forEach((err) => {
                    tl.error(err, tl.IssueSource.CustomerScript);
                });
            }
        }
        catch (err) {
            tl.setResult(tl.TaskResult.Failed, err.message || 'run() failed');
        }
    });
}
run();
