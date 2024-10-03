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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const j20_1 = __importDefault(require("./j20"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const camelcase = require('camelcase');
const update_code_1 = require("./utils/update_code");
const constants_1 = require("./utils/constants");
let currentPanel = undefined;
async function activate(context) {
    //   console.log(`-------extension is activated : --------`);
    const disposable = vscode.commands.registerCommand('j20.helloWorld', async () => {
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
                        var finalCode = await convertToDart(undefined, undefined, e.text, e.object, e.className);
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
                        var finalCode = await convertToDart(undefined, undefined, e.text, e.object, e.className);
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
    });
    context.subscriptions.push(disposable);
    //check if it is freezed class
    let freezed = vscode.commands.registerCommand('extension.showIfFreezedExists', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const text = document.getText();
            // Check if the file contains the "@freezed" string
            if (text.includes('@freezed')) {
                vscode.commands.executeCommand('setContext', 'freezedInFile', true);
            }
            else {
                vscode.commands.executeCommand('setContext', 'freezedInFile', false);
            }
        }
    });
    //   console.log(`-------Execute the command when the active editor changes --------`);
    // Execute the command when the active editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        // console.log(`-----inside--Execute the command when the active editor changes --------`);
        vscode.commands.executeCommand('extension.showIfFreezedExists');
    }));
    //   console.log(`-------Execute the command when the active editor saved --------`);
    // Execute the command when the text document is saved
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        // console.log(`------ inside -Execute the command when the active editor saved--------`);
        vscode.commands.executeCommand('extension.showIfFreezedExists');
    }));
    context.subscriptions.push(freezed);
    // add variables
    let createVariableInState = vscode.commands.registerCommand('j20-freezed-add-variables', async (args) => {
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
    });
    context.subscriptions.push(createVariableInState);
}
function deactivate() { }
class JsonToDartConfig {
    outputFolder = "lib";
    typeChecking = undefined;
    nullValueDataType = "dynamic";
    nullSafety = false;
    copyWithMethod = false;
    mergeArrayApproach = true;
    checkNumberAsNum = false;
}
async function convertToDart(folder, file, json, object, className) {
    const jsonToDartConfig = new JsonToDartConfig();
    const typeCheck = object?.typecheck ?? false;
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    try {
        // const data = await vscode.env.clipboard.readText();
        const obj = JSON.parse(json ? json : {});
        const nullSafety = object?.nullSafety || object?.optional ? true : false;
        const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
        const copyWithMethod = object?.copywith ?? false;
        const nullValueDataType = jsonToDartConfig.nullValueDataType;
        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        const converter = new j20_1.default(tabSize, typeCheck, nullValueDataType, nullSafety);
        converter.setIncludeCopyWithMethod(copyWithMethod);
        converter.setMergeArrayApproach(mergeArrayApproach);
        converter.setUseNum(useNum);
        converter.setRequiredProperty(object?.required ? object.required : false);
        converter.setFinalProperty(object?.final ? object.final : false);
        converter.putEnCoderAndDeCoder(object?.encoder ? object.encoder : false);
        converter.setIncludeFreezedMethod(object?.freezed ? object.freezed : false);
        converter.setIncludeOptionalMethod(object?.optional ? object.optional : false);
        converter.setTypesOnlyCode(object?.typesonly ? object.typesonly : false);
        var code = converter.parse(className ? className : "Json", obj).map(r => r.code).join("\n");
        if (object?.typesonly == false && object?.encoder) {
            code = `import 'dart:convert';\n` + code;
        }
        if (object?.freezed) {
            code = `
// Don't have packages for freezed ,add below packages
// flutter pub add freezed_annotation
// flutter pub add dev:build_runner
// flutter pub add dev:freezed
// # if using freezed to generate fromJson/toJson, also add:
// flutter pub add json_annotation
// flutter pub add dev:json_serializable
// To run the code generator, execute the following command:
// dart run build_runner build
import 'package:freezed_annotation/freezed_annotation.dart';
part '{your file name}.freezed.dart';
part '{your file name}.g.dart';\n` + code;
        }
        return code;
    }
    catch (e) {
        // console.log(`------inside catch function :${e} ---------`);
        vscode.window.showErrorMessage(`${e}`);
    }
}
//# sourceMappingURL=extension.js.map