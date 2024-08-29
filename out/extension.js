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
const fs_extra_1 = require("fs-extra");
let currentPanel = undefined;
async function activate(context) {
    console.log('Congratulations, your extension "j20" is now active!');
    const disposable = vscode.commands.registerCommand('j20.helloWorld', async () => {
        vscode.window.showInformationMessage('Hello World from j20!');
        // openTextOperationEditor();
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (currentPanel) {
            // console.log(`-------inside current pannnel --------`);
            // If we already have a panel, show it in the target column
            currentPanel.reveal(columnToShowIn);
            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(e => {
                // console.log(`-------on did receive messsage : ${e.text}--------`);
                // console.log(`-------on did receive messsage :e.type ${e.type}--------`);
                switch (e.type) {
                    case 'j20':
                        convertToDart(undefined, undefined, e.text);
                        break;
                    // Add more cases for other operations
                }
            });
        }
        else {
            // Otherwise, create a new panel
            // console.log(`-------inside nwe web pannnel --------`);
            currentPanel = vscode.window.createWebviewPanel('j20', 'JSON INPUT', columnToShowIn || vscode.ViewColumn.One, {
                enableScripts: true
            });
            currentPanel.webview.html = getWebviewContent();
            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(e => {
                console.log(`-------on did receive messsage : ${e.text}--------`);
                console.log(`-------on did receive messsage :e.type ${e.type}--------`);
                switch (e.type) {
                    case 'j20':
                        console.log(`-------on did receive j20 : ${e.text}--------`);
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                        convertToDart(undefined, undefined, e.text);
                        break;
                    // Add more cases for other operations
                }
            });
            // Reset when the current panel is closed
            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }
        // convertToDart();
        // const value = await vscode.window.showInputBox({
        // 	placeHolder:"Enter Your Class Name" 
        // });
    });
    context.subscriptions.push(vscode.commands.registerCommand('j20.convertFromClipboardToFolder', async (e) => {
        // console.log(`------FromFolder : ${e.path}---------`);
        convertToDart(e.path);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('j20.convertFromClipboardToFile', async (e) => {
        const path = e.path.toString();
        // console.log(`------From File : ${path}---------`);
        const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
        // console.log(`------From File i : ${i}---------`);
        convertToDart(e.path.substring(0, i), e.path.substring(i));
    }));
    context.subscriptions.push(disposable);
}
// This method is called when your extension is deactivated
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
async function convertToDart(folder, file, json) {
    const jsonToDartConfig = new JsonToDartConfig();
    // console.log(`------jsontodartconfig.typechecking : ${jsonToDartConfig.typeChecking}---------`);
    const typeCheck = jsonToDartConfig.typeChecking ?? true;
    // (await vscode.window.showQuickPick(["Yes", "No"], {
    // 	placeHolder: "Need type checking?"
    // }) === "Yes");
    // console.log(`------jsontodartconfig.checknumberasnum : ${jsonToDartConfig.checkNumberAsNum}---------`);
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    try {
        const data = await vscode.env.clipboard.readText();
        // console.log(`------data from clipboard :${data} ---------`);
        // console.log(`------data from json :${json} ---------`);
        const obj = JSON.parse(json ? json : data);
        const nullSafety = jsonToDartConfig.nullSafety ?? true;
        // console.log(`------nullsafety :${nullSafety} ---------`);
        const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
        // console.log(`------mergearray aproach :${mergeArrayApproach} ---------`);
        const copyWithMethod = jsonToDartConfig.copyWithMethod ?? false;
        // console.log(`------copywithmethod :${copyWithMethod} ---------`);
        const nullValueDataType = jsonToDartConfig.nullValueDataType;
        // console.log(`------nullvaluedatatype :${nullValueDataType} ---------`);
        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        // console.log(`------tabsize :${tabSize} ---------`);
        const converter = new j20_1.default(tabSize, typeCheck, nullValueDataType, nullSafety);
        converter.setIncludeCopyWitMethod(copyWithMethod);
        converter.setMergeArrayApproach(mergeArrayApproach);
        converter.setUseNum(useNum);
        const code = converter.parse("Json", obj).map(r => r.code).join("\n");
        // console.log(`------after convertion : code : ${code} ,filepath : ${filePath}---------`);
        const file = (0, fs_extra_1.outputFileSync)("", code);
        vscode.window.showInformationMessage(`Converting done...`);
    }
    catch (e) {
        // console.log(`------inside catch function :${e} ---------`);
        vscode.window.showErrorMessage(`${e}`);
    }
}
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>j20</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                display: flex;
                height: 100vh;
                flex-direction: row;
            }
            #editor {
                flex: 1;
                background-color: #1e2a38;
                color: white;
                position: relative;
                padding: 10px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
            }
            #options-container {
                position: absolute;
                top: 50%;
                right: 10px;
				transform: translateY(-50%);
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                z-index: 1000;
            }
            #code {
                flex: 1;
                padding: 10px;
                background-color:  #ffffff;
                overflow: auto;
                box-sizing: border-box;
            }
            header {
                background-color: #c70e33;
                padding: 10px;
                color: white;
                font-size: 1.2em;
            }
            textarea {
                flex: 1;
                width: 100%;
                background-color: #1e2a38;
                color: white;
                border: none;
                resize: none;
                padding: 10px;
                box-sizing: border-box;
                border-radius: 5px;
            }
        </style>
    </head>
    <body>
        <div id="editor">
            <header>Json To Dart</header>
            <textarea placeholder="{}"></textarea>
         
        </div>
        <div id="code">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="margin: 0;">Dart Class</p>
            </div>
            <pre style="margin-top: 10px; padding: 10px; overflow: auto;">// Final code will appear here</pre>
			<div id="options-container">
                <p>Options:</p>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li><label><input type="checkbox" checked> Null Safety</label></li>
                    <li><label><input type="checkbox"> Types only</label></li>
                    <li><label><input type="checkbox"> Put encoder & decoder in Class</label></li>
                    <li><label><input type="checkbox"> Make all properties required</label></li>
                    <li><label><input type="checkbox"> Make all properties final</label></li>
                    <li><label><input type="checkbox"> Generate CopyWith method</label></li>
                    <li><label><input type="checkbox"> Make all properties optional</label></li>
                </ul>
                <button style="margin-top: 10px; padding: 5px 10px;">Copy Code</button>
            </div>
        </div>
    </body>
    </html>`;
}
//# sourceMappingURL=extension.js.map