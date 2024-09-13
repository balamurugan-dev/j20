
import * as vscode from 'vscode';
import JsonToDart from './j20';
import { outputFileSync } from 'fs-extra';
import * as fs from 'fs';
import * as path from 'path';



let currentPanel: vscode.WebviewPanel | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {


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
            currentPanel.webview.onDidReceiveMessage(async e => {
                // console.log(`-------on did receive messsage : ${e.text}--------`);
                // console.log(`-------on did receive messsage :e.type ${e.type}--------`);

                switch (e.command) {

                    case 'j20':
                        console.log(`-------on did receive j20 : ${e.text}--------`);
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                       var finalCode = await convertToDart(undefined, undefined, e.text);
                        currentPanel!.webview.postMessage({ command: 'j20' ,code :finalCode! });

                        break;
                        break;
                    case 'copycode':
                        vscode.window.showInformationMessage("Code is Copied");
                        break;
                    // Add more cases for other operations
                }
            });
        } else {
            // Otherwise, create a new panel
            // console.log(`-------inside nwe web pannnel --------`);

            currentPanel = vscode.window.createWebviewPanel(
                'j20',
                'JSON INPUT',
                columnToShowIn || vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))],
                    retainContextWhenHidden : true

                }
            );
            // currentPanel.webview.html = getWebviewContent();
            const htmlPath = path.join(context.extensionPath, 'media', 'index.html');
            // Get the URI for the CSS file
            const styleUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(
                path.join(context.extensionPath, 'media', 'style.css')
            ));
            //Get The Uri for Script file 
            const scriptUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', 'script.js')))
            // Read the HTML file and inject the CSS path into it
            let html = fs.readFileSync(htmlPath, 'utf8');
            html = html.replace('{{styleUri}}', styleUri.toString());
            html = html.replace('{{scriptUri}}', scriptUri.toString());

            currentPanel.webview.html = html;
            // Handle messages from the webview
            currentPanel.webview.onDidReceiveMessage(async e  => {
                console.log(`-------on did receive messsage : ${e.text}--------`);
                console.log(`-------on did receive messsage :e.type ${e.command}--------`);

                switch (e.command) {

                    case 'j20':
                        console.log(`-------on did receive j20 : ${e.text}--------`);
                        if (e.text === "" || null) {
                            vscode.window.showErrorMessage("Please enter or past your json");
                            return;
                        }
                       var finalCode = await convertToDart(undefined, undefined, e.text ,e.object);
                        currentPanel!.webview.postMessage({ command: 'j20' ,code :finalCode! });

                        break;
                    case 'copycode':
                        vscode.window.showInformationMessage("Code is Copied");
                        break;
                    // Add more cases for other operations
                }
            });
            

            // Reset when the current panel is closed
            currentPanel.onDidDispose(
                () => {
                    currentPanel = undefined;
                },
                null,
                context.subscriptions
            );
        }
        // convertToDart();
        // const value = await vscode.window.showInputBox({
        // 	placeHolder:"Enter Your Class Name" 
        // });
    });
    context.subscriptions.push(
        vscode.commands.registerCommand('j20.convertFromClipboardToFolder', async (e) => {
            // console.log(`------FromFolder : ${e.path}---------`);

            convertToDart(e.path);
        }));
    context.subscriptions.push
        (vscode.commands.registerCommand('j20.convertFromClipboardToFile', async (e) => {
            const path = e.path.toString() as string;
            // console.log(`------From File : ${path}---------`);

            const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
            // console.log(`------From File i : ${i}---------`);

            convertToDart(e.path.substring(0, i), e.path.substring(i));
        }));


    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
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
interface options{
    nullSafety: boolean,
            typesonly: boolean,
            typecheck:boolean,
            encoder: boolean,
            required: boolean,
            final: boolean,
            copywith: boolean,
             optional: boolean,
            freezed: boolean
}

async function convertToDart(folder?: string, file?: string, json?: any ,object?:options) {
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

        const converter = new JsonToDart(tabSize, typeCheck, nullValueDataType, nullSafety);
        converter.setIncludeCopyWithMethod(copyWithMethod);
        converter.setMergeArrayApproach(mergeArrayApproach);
        converter.setUseNum(useNum);
        const code = converter.parse("Json", obj).map(r => r.code).join("\n");
        return code;
        // console.log(`------after convertion : code : ${code} ,filepath : ${filePath}---------`);

        // const file = outputFileSync("", code);
        // vscode.window.showInformationMessage(`Converting done...`);
    } catch (e) {
        // console.log(`------inside catch function :${e} ---------`);

        vscode.window.showErrorMessage(`${e}`);
    }
}


