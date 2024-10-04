
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { addVariableToState } from './utils/update_code';
import { NAME_ERROR_MESSAGE, NAME_REG_EXP } from './utils/constants';
import { convertToDart } from './utils/jsonToDart/json_to_dart';





export function activate(context: vscode.ExtensionContext) {
let currentPanel: vscode.WebviewPanel | undefined = undefined;
   
    let convertJSON = vscode.commands.registerCommand('json-to-dart.convertJSON', async () => {
        try {
            // Your command logic       
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
            const scriptUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')));
            let html = fs.readFileSync(htmlPath, 'utf8');
            // console.log(`-------on html path messsage : ${htmlPath}--------`);
            // console.log(`-------on html list : ${html.split('/n')}--------`);
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
    } catch (error) {
        // console.error('Error in convertJSON command handler:', error);
        // console.error(error); // Log the error
        vscode.window.showErrorMessage(`${error}`);
    }
    });


    context.subscriptions.push(convertJSON);

    // add variables
    let createVariableInFreezed = vscode.commands.registerCommand('json-to-dart.addVariableInFreezed', async (args) => {
        // console.log('createVariableInFreezed command handler called');
        // vscode.window.showInformationMessage('createVariableInFreezed command handler called');

        try {
            let nameFieldValidator = new RegExp(NAME_REG_EXP);
            var varType = await vscode.window.showQuickPick(["Number", "Int", "Double", "String", "Bool", "List", "Set", "Map", "Dynamic"],
                { title: "Select Variable Type", canPickMany: false });
            if (varType === undefined) {
                return "No data";
            }
            let varName = await vscode.window.showInputBox({
                title: "Enter Variable Name",
                validateInput: (val) => nameFieldValidator.test(val) ? NAME_ERROR_MESSAGE : '',
            });
            if (varName === undefined) {
                return "No data";
            }
            addVariableToState(args.path, varType, varName);
        } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
        }
      
    });

    context.subscriptions.push(createVariableInFreezed);
}
export function deactivate() {

}



