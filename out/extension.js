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
const path_1 = require("path");
const yaml_1 = require("yaml");
const j20_1 = __importDefault(require("./j20"));
const lodash_1 = require("lodash");
const fs_extra_1 = require("fs-extra");
let currentPanel = undefined;
async function activate(context) {
    console.log('Congratulations, your extension "j20" is now active!');
    context.subscriptions.push(vscode.window.registerCustomEditorProvider('textOperationEditor', new TextOperationEditorProvider(context)));
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
            currentPanel = vscode.window.createWebviewPanel('catCoding', 'JSON INPUT', columnToShowIn || vscode.ViewColumn.One, {
                enableScripts: true
            });
            currentPanel.webview.html = getWebviewContent();
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
// class JsonToDartConfig {
// 	outputFolder: String = "lib";
// 	typeChecking: Boolean | undefined = undefined;
// 	nullValueDataType: String = "dynamic";
// 	nullSafety: Boolean = false;
// 	copyWithMethod: Boolean = false;
// 	mergeArrayApproach: Boolean = true;
// 	checkNumberAsNum: Boolean = false;
// }
async function convertToDart(folder, file, json) {
    // The code you place here will be executed every time your command is executed
    const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
    // console.log(`------workSpacePath : ${workspacePath}---------`);
    const pubspec = await vscode.workspace.openTextDocument((0, path_1.join)(...workspacePath, "pubspec.yaml"));
    // console.log(`------pubspec : ${pubspec.getText()}-------`);
    const pubspecTree = (0, yaml_1.parse)(pubspec.getText());
    // console.log(`------pubspectree : ${JSON.stringify(pubspecTree)}---------`);
    // console.log(`------pubspectree.jsontodart : ${pubspecTree?.jsonToDart ?? {
    // 	outputFolder: "lib"
    // }}---------`);
    const jsonToDartConfig = pubspecTree?.jsonToDart ?? {
        outputFolder: "lib"
    };
    // console.log(`------jsontodartconfig : ${JSON.stringify(jsonToDartConfig)}---------`);
    // Display a message box to the user
    const value = await vscode.window.showInputBox({
        placeHolder: file || folder ? "Class Name" : "package.Class Name\n",
    });
    // console.log(`------value : ${value}---------`);
    if (!value || value === "") {
        return;
    }
    // console.log(`------jsontodartconfig.typechecking : ${jsonToDartConfig.typeChecking}---------`);
    const typeCheck = jsonToDartConfig.typeChecking ??
        (await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: "Need type checking?"
        }) === "Yes");
    // console.log(`------jsontodartconfig.checknumberasnum : ${jsonToDartConfig.checkNumberAsNum}---------`);
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    // console.log(`------useNum : ${useNum}---------`);
    if (useNum === "ask") {
        useNum = (await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: "Using number(num) checker on int & double value?"
        }) === "Yes");
    }
    const packageAndClass = value?.toString() ?? "";
    // console.log(`------package and class: ${packageAndClass}---------`);
    const paths = packageAndClass.split(".");
    // console.log(`------paths: ${paths}---------`);
    const className = paths.pop() ?? "";
    // console.log(`------classname: ${className}---------`);
    let fileName;
    if (file) {
        fileName = file;
    }
    else {
        // console.log(`------snakecase :${snakeCase(className)}.dart ---------`);
        fileName = await filenameHandler(`${(0, lodash_1.snakeCase)(className)}.dart`);
        // console.log(`------after file name handler :${fileName} ---------`);
    }
    try {
        const filePath = folder ? (0, path_1.join)(folder.startsWith("/") || folder.startsWith("\\") ? folder.substring(1) : folder, fileName) : (0, path_1.join)(...(workspacePath), jsonToDartConfig.outputFolder, ...paths, fileName).substring(1);
        // console.log(`------filepath :${filePath} ---------`);
        vscode.window.showInformationMessage(`Writing ${filePath}`);
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
        const code = converter.parse(className, obj).map(r => r.code).join("\n");
        // console.log(`------after convertion : code : ${code} ,filepath : ${filePath}---------`);
        const file = (0, fs_extra_1.outputFileSync)(filePath, code);
        vscode.window.showInformationMessage(`Converting done...`);
    }
    catch (e) {
        // console.log(`------inside catch function :${e} ---------`);
        vscode.window.showErrorMessage(`${e}`);
    }
}
const filenameHandler = async (fileName) => {
    const confirmFilename = await vscode.window.showQuickPick(["Yes", "No"], {
        placeHolder: `Use ${fileName} as file name?`
    });
    if (confirmFilename !== "Yes") {
        const value = await vscode.window.showInputBox({
            placeHolder: "Please input file Name\n"
        });
        if (!value || value.trim() === "") {
            return await filenameHandler(fileName);
        }
        else {
            return value.endsWith(".dart") ? value : value + ".dart";
        }
    }
    return fileName;
};
class TextOperationEditorProvider {
    context;
    constructor(context) {
        this.context = context;
    }
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        console.log(`Open Text input provider`);
        const text = document.getText();
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(text);
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(e => {
            // console.log(`-------on did receive messsage : ${e.text}--------`);
            // console.log(`-------on did receive messsage :e.type ${e.type}--------`);
            switch (e.type) {
                case 'update':
                    this.updateTextDocument(document, e.text);
                    break;
                case 'uppercase':
                    this.updateTextDocument(document, e.text.toUpperCase());
                    break;
                case 'lowercase':
                    this.updateTextDocument(document, e.text.toLowerCase());
                    break;
                case 'j20':
                    convertToDart();
                    break;
                // Add more cases for other operations
            }
        });
    }
    getHtmlForWebview(text) {
        const nonce = getNonce();
        return '';
    }
    updateTextDocument(document, text) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), text);
        vscode.workspace.applyEdit(edit);
    }
}
function openTextOperationEditor() {
    // Create a new file URI with a temporary name
    const fileName = 'JSON INPUT';
    const filePath = vscode.Uri.parse(`untitled:${fileName}`);
    // Open the document and then open it with the custom editor
    vscode.workspace.openTextDocument(filePath).then(document => {
        vscode.commands.executeCommand('vscode.openWith', document.uri, 'textOperationEditor');
    });
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function getWebviewContent() {
    const nonce = getNonce();
    return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<style nonce="${nonce}">
			body {
				margin: 0;
				padding: 0;
				display: flex;
				flex-direction: column;
				height: 100vh;
				font-family: Arial, sans-serif;
			}
			#textInput {
				flex: 1;
				width: 100%;
				box-sizing: border-box;
				padding: 10px;
				font-size: 16px;
				line-height: 1.5;
				border: none;
				resize: none;
			}
			#controls {
				display: flex;
				justify-content: center;
				padding: 10px;
				background-color: #f3f3f3;
				border-top: 1px solid #ccc;
			}
			button {
				margin: 0 5px;
				padding: 10px 20px;
				font-size: 14px;
				cursor: pointer;
				border: none;
				background-color: #007acc;
				color: white;
				border-radius: 4px;
			}
			button:hover {
				background-color: #005f99;
			}
		</style>
	</head>
	<body>
		<textarea id="textInput"></textarea>
		<div id="controls">
			<button onclick="performOperation('j20')">Json To Dart</button>

			<!-- Add more buttons for different operations -->
		</div>
		<script nonce="${nonce}">
			const vscode = acquireVsCodeApi();

			document.getElementById('textInput').addEventListener('input', () => {
				vscode.postMessage({
					type: 'update',
					text: document.getElementById('textInput').value
				});
			});

			function performOperation(operation) {
				vscode.postMessage({
					type: operation,
					text: document.getElementById('textInput').value
				});
			}
		</script>
	</body>
	</html>`;
}
//# sourceMappingURL=extension.js.map