
import * as vscode from 'vscode';
import JsonToDart from './j20';
import * as fs from 'fs';
import * as path from 'path';
const camelcase = require('camelcase');



let currentPanel: vscode.WebviewPanel | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('j20.helloWorld', async () => {

        vscode.window.showInformationMessage('Hello World from j20!');
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);

            currentPanel.webview.onDidReceiveMessage(async e => {
                switch (e.command) {

                    case 'j20':
                        // console.log(`-------on did receive j20 : ${e.text}--------`);
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                        var finalCode = await convertToDart(undefined, undefined, e.text, e.object, e.className);
                        currentPanel!.webview.postMessage({ command: 'j20', code: finalCode! });

                        break;
                    case 'copycode':
                        vscode.window.showInformationMessage("Code is Copied");
                        break;
                }
            });
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'j20',
                'JSON INPUT',
                columnToShowIn || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
                    retainContextWhenHidden: true

                }
            );
            const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
            // Get the URI for the CSS file
            const styleUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(
                path.join(context.extensionPath, 'media', 'style.css')
            ));
            //Get The Uri for Script file 
            const scriptUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')))
            let html = fs.readFileSync(htmlPath, 'utf8');
            html = html.replace('{{styleUri}}', styleUri.toString());
            html = html.replace('{{scriptUri}}', scriptUri.toString());

            currentPanel.webview.html = html;
            currentPanel.webview.onDidReceiveMessage(async e => {
                // console.log(`-------on did receive messsage : ${e.text}--------`);
                // console.log(`-------on did receive messsage :e.type ${e.command}--------`);

                switch (e.command) {

                    case 'j20':
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                        var finalCode = await convertToDart(undefined, undefined, e.text, e.object, e.className);
                        currentPanel!.webview.postMessage({ command: 'j20', code: finalCode! });

                        break;
                    case 'copycode':
                        vscode.window.showInformationMessage("Code is Copied");
                        break;

                }
            });

            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }
    });


    context.subscriptions.push(disposable);
}
export function deactivate() { }
class JsonToDartConfig {
    outputFolder: String = "lib";
    typeChecking: boolean | undefined = undefined;
    nullValueDataType: String = "dynamic";
    nullSafety: boolean = false;
    copyWithMethod: boolean = false;
    mergeArrayApproach: boolean = true;
    checkNumberAsNum: boolean = false;
}
interface options {
    nullSafety: boolean,
    typesonly: boolean,
    typecheck: boolean,
    encoder: boolean,
    required: boolean,
    final: boolean,
    copywith: boolean,
    optional: boolean,
    freezed: boolean
}

async function convertToDart(folder?: string, file?: string, json?: any, object?: options, className?: string) {
    const jsonToDartConfig = new JsonToDartConfig();
    const typeCheck = object?.typecheck ?? false;
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    try {
        const data = await vscode.env.clipboard.readText();
        const obj = JSON.parse(json ? json : data);
        const nullSafety = object?.nullSafety ?? true;
        const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
        const copyWithMethod = object?.copywith ?? false;
        const nullValueDataType = jsonToDartConfig.nullValueDataType;
        const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
        const converter = new JsonToDart(tabSize, typeCheck, nullValueDataType, nullSafety);
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
        if (object?.typesonly == false && object?.freezed) {
            code = `import 'package:freezed_annotation/freezed_annotation.dart';
part '${camelcase(className ? className : "Json", { pascalCase: true })}.freezed.dart';
part '${camelcase(className ? className : "Json", { pascalCase: true })}.g.dart';\n` + code;
        }
        return code;
    } catch (e) {
        // console.log(`------inside catch function :${e} ---------`);

        vscode.window.showErrorMessage(`${e}`);
    }
}


