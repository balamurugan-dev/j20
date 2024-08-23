
import * as vscode from 'vscode';
import {join} from 'path';
import {parse} from 'yaml';
import JsonToDart from './j20';
import { snakeCase } from 'lodash';
import { outputFileSync } from 'fs-extra';



export async function activate(context: vscode.ExtensionContext) {


	console.log('Congratulations, your extension "j20" is now active!');


	const disposable = vscode.commands.registerCommand('j20.helloWorld',async () => {
		
		vscode.window.showInformationMessage('Hello World from j20!');
	
convertToDart();
		// const value = await vscode.window.showInputBox({
		// 	placeHolder:"Enter Your Class Name" 
		// });
	});
	context.subscriptions.push(
		vscode.commands.registerCommand('j20.convertFromClipboardToFolder', async (e) => {
			console.log(`------FromFolder : ${e.path}---------`);

			convertToDart(e.path);
		}));
	context.subscriptions.push
		(vscode.commands.registerCommand('j20.convertFromClipboardToFile', async (e) => {
			const path = e.path.toString() as string;
			console.log(`------From File : ${path}---------`);

			const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1;
			convertToDart(e.path.substring(0, i), e.path.substring(i));
		}));

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
class JsonToDartConfig {
	outputFolder: String = "lib";
	typeChecking: Boolean | undefined = undefined;
	nullValueDataType: String = "dynamic";
	nullSafety: Boolean = false;
	copyWithMethod: Boolean = false;
	mergeArrayApproach: Boolean = true;
	checkNumberAsNum: Boolean = false;
}

async function convertToDart(folder?: string, file?: string) {
	// The code you place here will be executed every time your command is executed
	const workspacePath = vscode.workspace.workspaceFolders?.map(e => e.uri.path) ?? [];
	console.log(`------workSpacePath : ${workspacePath}---------`);
const pubspec = await vscode.workspace.openTextDocument(join(...workspacePath, "pubspec.yaml"));
console.log(`------pubspec : ${pubspec.getText()}-------`);

const pubspecTree = parse(pubspec.getText());
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
	let fileName: string;
	if (file) {
		fileName = file;
	} else {
		fileName = await filenameHandler(`${snakeCase(className)}.dart`);
	}

	try {
		const filePath = folder ? join(folder.startsWith("/") || folder.startsWith("\\") ? folder.substring(1) : folder, fileName) : join(
			...(workspacePath),
			jsonToDartConfig.outputFolder,
			...paths, fileName);
		vscode.window.showInformationMessage(`Writing ${filePath}`);


		const data = await vscode.env.clipboard.readText();
		const obj = JSON.parse(data);
		const nullSafety = jsonToDartConfig.nullSafety ?? true;
		const mergeArrayApproach = jsonToDartConfig.mergeArrayApproach ?? false;
		const copyWithMethod = jsonToDartConfig.copyWithMethod ?? false;
		const nullValueDataType = jsonToDartConfig.nullValueDataType;
		const { tabSize } = vscode.workspace.getConfiguration("editor", { languageId: "dart" });
		const converter = new JsonToDart(tabSize, typeCheck, nullValueDataType, nullSafety);
		converter.setIncludeCopyWitMethod(copyWithMethod);
		converter.setMergeArrayApproach(mergeArrayApproach);
		converter.setUseNum(useNum);
		const code = converter.parse(className, obj).map(r => r.code).join("\n");
		const file = outputFileSync(filePath, code);
		vscode.window.showInformationMessage(`Converting done...`);
	} catch (e) {
		vscode.window.showErrorMessage(`${e}`);
	}
}

const filenameHandler = async (fileName: string): Promise<string> => {
	const confirmFilename =
		await vscode.window.showQuickPick(["Yes", "No"], {
			placeHolder: `Use ${fileName} as file name?`
		});

	if (confirmFilename !== "Yes") {
		const value = await vscode.window.showInputBox({
			placeHolder: "Please input file Name\n"
		});

		if (!value || value.trim() === "") {
			return await filenameHandler(fileName);
		} else {
			return value.endsWith(".dart") ? value : value + ".dart";
		}
	}
	return fileName;
};
