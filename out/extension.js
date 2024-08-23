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
async function activate(context) {
    console.log('Congratulations, your extension "j20" is now active!');
    const disposable = vscode.commands.registerCommand('j20.helloWorld', async () => {
        vscode.window.showInformationMessage('Hello World from j20!');
        convertToDart();
        // const value = await vscode.window.showInputBox({
        // 	placeHolder:"Enter Your Class Name" 
        // });
    });
    context.subscriptions.push(vscode.commands.registerCommand('j20.convertFromClipboardToFolder', async (e) => {
        console.log(`------FromFolder : ${e.path}---------`);
        convertToDart(e.path);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('j20.convertFromClipboardToFile', async (e) => {
        const path = e.path.toString();
        console.log(`------From File : ${path}---------`);
        const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
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
async function convertToDart(folder, file) {
    // The code you place here will be executed every time your command is executed
    const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
    console.log(`------workSpacePath : ${workspacePath}---------`);
    const pubspec = await vscode.workspace.openTextDocument((0, path_1.join)(...workspacePath, "pubspec.yaml"));
    console.log(`------pubspec : ${pubspec.getText()}-------`);
    const pubspecTree = (0, yaml_1.parse)(pubspec.getText());
    console.log(`------pubspectree : ${pubspecTree}---------`);
    const jsonToDartConfig = pubspecTree?.jsonToDart ?? {
        outputFolder: "lib"
    };
    // Display a message box to the user
    const value = await vscode.window.showInputBox({
        placeHolder: file || folder ? "Class Name" : "package.Class Name\n",
    });
    if (!value || value === "") {
        return;
    }
    const typeCheck = jsonToDartConfig.typeChecking ??
        (await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: "Need type checking?"
        }) === "Yes");
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    if (useNum === "ask") {
        useNum = (await vscode.window.showQuickPick(["Yes", "No"], {
            placeHolder: "Using number(num) checker on int & double value?"
        }) === "Yes");
    }
    const packageAndClass = value?.toString() ?? "";
    const paths = packageAndClass.split(".");
    const className = paths.pop() ?? "";
    let fileName;
    if (file) {
        fileName = file;
    }
    else {
        fileName = await filenameHandler(`${(0, lodash_1.snakeCase)(className)}.dart`);
    }
    try {
        const filePath = folder ? (0, path_1.join)(folder.startsWith("/") || folder.startsWith("\\") ? folder.substring(1) : folder, fileName) : (0, path_1.join)(...(workspacePath), jsonToDartConfig.outputFolder, ...paths, fileName);
        vscode.window.showInformationMessage(`Writing ${filePath}`);
        const data = await vscode.env.clipboard.readText();
        const obj = JSON.parse(data);
        const nullSafety = jsonToDartConfig.nullSafety ?? true;
        const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
        const copyWithMethod = jsonToDartConfig.copyWithMethod ?? false;
        const nullValueDataType = jsonToDartConfig.nullValueDataType;
        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        const converter = new j20_1.default(tabSize, typeCheck, nullValueDataType, nullSafety);
        converter.setIncludeCopyWitMethod(copyWithMethod);
        converter.setMergeArrayApproach(mergeArrayApproach);
        converter.setUseNum(useNum);
        const code = converter.parse(className, obj).map(r => r.code).join("\n");
        const file = (0, fs_extra_1.outputFileSync)(filePath, code);
        vscode.window.showInformationMessage(`Converting done...`);
    }
    catch (e) {
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
//# sourceMappingURL=extension.js.map