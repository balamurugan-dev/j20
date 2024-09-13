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
            currentPanel.webview.onDidReceiveMessage(async (e) => {
                // console.log(`-------on did receive messsage : ${e.text}--------`);
                // console.log(`-------on did receive messsage :e.type ${e.type}--------`);
                switch (e.command) {
                    case 'j20':
                        console.log(`-------on did receive j20 : ${e.text}--------`);
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                        var finalCode = await convertToDart(undefined, undefined, e.text, e.object, e.className);
                        currentPanel.webview.postMessage({ command: 'j20', code: finalCode });
                        break;
                        break;
                    case 'copycode':
                        vscode.window.showInformationMessage("Code is Copied");
                        break;
                    // Add more cases for other operations
                }
            });
        }
        else {
            // Otherwise, create a new panel
            // console.log(`-------inside nwe web pannnel --------`);
            currentPanel = vscode.window.createWebviewPanel('j20', 'JSON INPUT', columnToShowIn || vscode.ViewColumn.One, {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
                retainContextWhenHidden: true
            });
            // currentPanel.webview.html = getWebviewContent();
            const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
            // Get the URI for the CSS file
            const styleUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'style.css')));
            //Get The Uri for Script file 
            const scriptUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
            // Read the HTML file and inject the CSS path into it
            let html = fs.readFileSync(htmlPath, 'utf8');
            html = html.replace('{{styleUri}}', styleUri.toString());
            html = html.replace('{{scriptUri}}', scriptUri.toString());
            currentPanel.webview.html = html;
            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(async (e) => {
                console.log(`-------on did receive messsage : ${e.text}--------`);
                console.log(`-------on did receive messsage :e.type ${e.command}--------`);
                switch (e.command) {
                    case 'j20':
                        console.log(`-------on did receive j20 : ${e.text}--------`);
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
async function convertToDart(folder, file, json, object, className) {
    const jsonToDartConfig = new JsonToDartConfig();
    // console.log(`------jsontodartconfig.typechecking : ${jsonToDartConfig.typeChecking}---------`);
    const typeCheck = object?.typecheck ?? false;
    // (await vscode.window.showQuickPick(["Yes", "No"], {
    // 	placeHolder: "Need type checking?"
    // }) === "Yes");
    // console.log(`------jsontodartconfig.checknumberasnum : ${jsonToDartConfig.checkNumberAsNum}---------`);
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    console.log(`------jsontodartconfig.checknumberasnum : ${useNum}---------`);
    try {
        const data = await vscode.env.clipboard.readText();
        // console.log(`------data from clipboard :${data} ---------`);
        // console.log(`------data from json :${json} ---------`);
        const obj = JSON.parse(json ? json : data);
        const nullSafety = object?.nullSafety ?? true;
        // console.log(`------nullsafety :${nullSafety} ---------`);
        const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
        console.log(`------mergearray aproach :${mergeArrayApproach} ---------`);
        const copyWithMethod = object?.copywith ?? false;
        console.log(`------copywithmethod :${copyWithMethod} ---------`);
        const nullValueDataType = jsonToDartConfig.nullValueDataType;
        console.log(`------nullvaluedatatype :${nullValueDataType} ---------`);
        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        console.log(`------tabsize :${tabSize} ---------`);
        const converter = new j20_1.default(tabSize, typeCheck, nullValueDataType, nullSafety);
        converter.setIncludeCopyWithMethod(copyWithMethod);
        converter.setMergeArrayApproach(mergeArrayApproach);
        converter.setUseNum(useNum);
        const code = converter.parse(className ? className : "Json", obj).map(r => r.code).join("\n");
        return code;
        // console.log(`------after convertion : code : ${code} ,filepath : ${filePath}---------`);
        // const file = outputFileSync("", code);
        // vscode.window.showInformationMessage(`Converting done...`);
    }
    catch (e) {
        // console.log(`------inside catch function :${e} ---------`);
        vscode.window.showErrorMessage(`${e}`);
    }
}
//# sourceMappingURL=extension.js.map