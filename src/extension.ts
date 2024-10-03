
import * as vscode from 'vscode';
import JsonToDart from './j20';
import * as fs from 'fs';
import * as path from 'path';
const camelcase = require('camelcase');
import { addVariableToState } from './utils/update_code';
import { NAME_ERROR_MESSAGE, NAME_REG_EXP, VARIABLE_NAME_ERROR_MESSAGE, NO_FOLDER_IN_WORKSPACE_FOUND, SUCCESFULLY_SET_PARENT } from './utils/constants';




let currentPanel: vscode.WebviewPanel | undefined = undefined;

export async function activate(context: vscode.ExtensionContext) {
//   console.log(`-------extension is activated : --------`);
    const disposable = vscode.commands.registerCommand('json-to-dart', async () => {  
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
      } else {
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
	});

	context.subscriptions.push(createVariableInState);
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
        // const data = await vscode.env.clipboard.readText();
        const obj = JSON.parse(json ? json : {});
        const nullSafety = object?.nullSafety || object?.optional ? true : false ;
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
    } catch (e) {
        // console.log(`------inside catch function :${e} ---------`);
        vscode.window.showErrorMessage(`${e}`);
    }
}


