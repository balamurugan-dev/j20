import * as fs from 'fs';
const _ = require('lodash');
import * as vscode from 'vscode';
function _addVariableToState(path: string, varType: string, varName: string) {
	// Read File
	varType = getVarType(varType);
	var newAPath  = path.startsWith("/") || path.startsWith("\\") ? path.substring(1) : path;
	const parentFreezedCodeList = fs.readFileSync(newAPath, 'utf8').split('\n');
	// console.log(JSON.stringify(parentFreezedCodeList));
	var updatedFreezedCodeList: string[] = parentFreezedCodeList;
// console.log(JSON.stringify(updatedFreezedCodeList));
		
	try{
		// Finding Class Name
	var index = updatedFreezedCodeList.findIndex(value => value.includes(`class `));
	var sendenceList = updatedFreezedCodeList[index].split(" ");
	var classNameIndex = sendenceList.findIndex(value => value.includes(`class`)) + 1;
	var className = sendenceList[classNameIndex];
	// console.log(`className : ${className}`);
	// Add Variable to constructor
	if (updatedFreezedCodeList.findIndex(value => value.includes(`factory ${className}({`)) > -1 || updatedFreezedCodeList.findIndex(value => value.includes(`${className}(`))) {
		let initVarText = `required ${varType} ${varName};`;
		const classIndex = updatedFreezedCodeList.findIndex(value => value.includes(`${className}({`)) + 1;
		// console.log(`updatedFreezedCodeList[classIndex] : ${updatedFreezedCodeList[classIndex]}`);
		if (updatedFreezedCodeList[classIndex].includes(`required`)) {
			initVarText = `    required ${varType} ${varName},`;
			// console.log(`initvartext : ${initVarText}`);
		} else if (updatedFreezedCodeList[classIndex].includes(`?`)) {
			initVarText = `    ${varType}? ${varName},`;
		}
		updatedFreezedCodeList = [...updatedFreezedCodeList.slice(0, classIndex), initVarText, ...updatedFreezedCodeList.slice(classIndex)];
		const indexOfLine = updatedFreezedCodeList.findIndex(value => value.includes(`${className}(`));
		fs.writeFileSync(newAPath, updatedFreezedCodeList.join('\n'));
	vscode.window.showInformationMessage(`Variable is added...`);
	}
	}catch (e) {
		vscode.window.showErrorMessage(`${e}`);
	}
} 


function getVarType(type: string): string {
	if (type.toLocaleLowerCase() === "number") {
		return "num";
	}
	if (type.toLocaleLowerCase() === "int") {
		return "int";
	}
	if (type.toLocaleLowerCase() === "double") {
		return "double";
	}
	if (type.toLocaleLowerCase() === "string") {
		return type;
	}
	if (type.toLocaleLowerCase() === "list" || type.toLocaleLowerCase() === "set" || type.toLocaleLowerCase() === "map") {
		return type;
	}
	return type.toLocaleLowerCase();
}

export var addVariableToState = _addVariableToState;