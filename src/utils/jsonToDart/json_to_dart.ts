import * as vscode from 'vscode';
import JsonToDart from './j20';

class JsonToDartConfig {
    outputFolder: string = "lib";
    typeChecking: boolean | undefined = undefined;
    nullValueDataType: string = "dynamic";
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

async function _convertToDart(folder?: string, file?: string, json?: any, object?: options, className?: string) {
    const jsonToDartConfig = new JsonToDartConfig();
    const typeCheck = object?.typecheck ?? false;
    let useNum = jsonToDartConfig.checkNumberAsNum ?? false;
    try {
        const obj = JSON.parse(json ? json : {});
        const nullSafety = object?.nullSafety || object?.optional ? true : false;
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
export var convertToDart = _convertToDart;