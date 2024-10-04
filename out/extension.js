"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// import JsonToDart from './j20';
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const update_code_1 = require("./utils/update_code");
const constants_1 = require("./utils/constants");
const json_to_dart_1 = require("./utils/jsonToDart/json_to_dart");
function activate(context) {
    console.log(`-------extension is activated : --------`);
    let currentPanel = undefined;
    let convertJSON = vscode.commands.registerCommand('json-to-dart.convertJSON', async () => {
        try {
            // Your command logic
            vscode.window.showInformationMessage('JSON conversion IsReady dear');
            const columnToShowIn = vscode.window.activeTextEditor
                ? vscode.window.activeTextEditor.viewColumn
                : undefined;
            if (currentPanel) {
                currentPanel.reveal(columnToShowIn);
                currentPanel.webview.onDidReceiveMessage(async (e) => {
                    switch (e.command) {
                        case 'j20':
                            // console.log(`-------on did receive j20 : ${e.text}--------`);
                            if (e.text === "" || null) {
                                vscode.window.showErrorMessage("Please enter or past your json");
                                return;
                            }
                            var finalCode = await (0, json_to_dart_1.convertToDart)(undefined, undefined, e.text, e.object, e.className);
                            currentPanel.webview.postMessage({ command: 'j20', code: finalCode });
                            break;
                        case 'copycode':
                            vscode.window.showInformationMessage("Code is Copied");
                            break;
                    }
                });
            }
            else {
                currentPanel = vscode.window.createWebviewPanel('j20', 'JSON INPUT', columnToShowIn || vscode.ViewColumn.One, {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
                    retainContextWhenHidden: true
                });
                const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
                // Get the URI for the CSS file
                const styleUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'style.css')));
                //Get The Uri for Script file 
                const scriptUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
                let html = fs.readFileSync(htmlPath, 'utf8');
                // console.log(`-------on html path messsage : ${htmlPath}--------`);
                // console.log(`-------on html list : ${html.split('/n')}--------`);
                html = html.replace('{{styleUri}}', styleUri.toString());
                html = html.replace('{{scriptUri}}', scriptUri.toString());
                currentPanel.webview.html = html;
                currentPanel.webview.onDidReceiveMessage(async (e) => {
                    // console.log(`-------on did receive messsage : ${e.text}--------`);
                    // console.log(`-------on did receive messsage :e.type ${e.command}--------`);
                    switch (e.command) {
                        case 'j20':
                            if (e.text === "" || null) {
                                vscode.window.showErrorMessage("Please enter or past your json");
                                return;
                            }
                            var finalCode = await (0, json_to_dart_1.convertToDart)(undefined, undefined, e.text, e.object, e.className);
                            currentPanel.webview.postMessage({ command: 'j20', code: finalCode });
                            break;
                        case 'copycode':
                            vscode.window.showInformationMessage("Code is Copied");
                            break;
                    }
                });
                currentPanel.onDidDispose(() => {
                    currentPanel = undefined;
                }, null, context.subscriptions);
            }
        }
        catch (error) {
            console.error('Error in convertJSON command handler:', error);
            console.error(error); // Log the error
            vscode.window.showErrorMessage(`Error: ${error}`);
        }
    });
    context.subscriptions.push(convertJSON);
    // add variables
    let createVariableInFreezed = vscode.commands.registerCommand('json-to-dart.addVariableInFreezed', async (args) => {
        console.log('createVariableInFreezed command handler called');
        vscode.window.showInformationMessage('createVariableInFreezed command handler called');
        try {
            let nameFieldValidator = new RegExp(constants_1.NAME_REG_EXP);
            var varType = await vscode.window.showQuickPick(["Number", "Int", "Double", "String", "Bool", "List", "Set", "Map", "Dynamic"], { title: "Select Variable Type", canPickMany: false });
            if (varType === undefined) {
                return "No data";
            }
            let varName = await vscode.window.showInputBox({
                title: "Enter Variable Name",
                validateInput: (val) => nameFieldValidator.test(val) ? constants_1.NAME_ERROR_MESSAGE : '',
            });
            if (varName === undefined) {
                return "No data";
            }
            (0, update_code_1.addVariableToState)(args.path, varType, varName);
        }
        catch (error) {
            console.error('Error in createVariableInFreezed command handler:', error);
        }
    });
    context.subscriptions.push(createVariableInFreezed);
}
function deactivate() {
}
//# sourceMappingURL=extension.js.map