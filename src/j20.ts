const camelcase = require('camelcase');

class JsonToDart {
    classNames: Array<String> = [];
    classModels: Array<Result> = [];
    indentText: String;
    shouldCheckType: boolean;
    nullSafety: boolean;
    includeCopyWitMethod: boolean = false;
    includeFromListMethod: boolean = false;
    includeFreezedMethod: boolean = false;
    includeOptionalMethod: boolean = false;
    makeRequiredProperty: boolean = false;
    makeFinalProperty: boolean = false;
    putEncoderDeCoder: boolean = false;
    mergeArrayApproach: boolean = true;
    typesOnly:boolean=false;
    useNum: boolean = false;
    nullValueDataType: String;
    handlerSymbol: String;
    constructor(tabSize: number, shouldCheckType?: boolean, nullValueDataType?: String, nullSafety?: boolean) {
        console.log(`Tab  size : ${tabSize}`)
        console.log(`shoutcheck rtype : ${shouldCheckType}`)
        console.log(`nullValuedatatype : ${nullValueDataType}`)
        console.log(`nullSafety: ${nullSafety}`)
        this.indentText = " ".repeat(tabSize);
        this.shouldCheckType = shouldCheckType ?? false;
        this.nullValueDataType = nullValueDataType ?? "dynamic";
        this.nullSafety = nullSafety ?? true;
        this.handlerSymbol = nullSafety ? "?" : "";
    }

    setIncludeCopyWithMethod(b: boolean) {
        console.log(`this.includeCopyWitMethod : ${b}`)
        this.includeCopyWitMethod = b;
    }
    setIncludeFromListWithMethod(b: boolean) {
        console.log(`this.includeFromListMethod : ${b}`)

        this.includeFromListMethod = b;
    }
    setMergeArrayApproach(b: boolean) {
        console.log(`this.mergeArrayApproach : ${b}`)

        this.mergeArrayApproach = b;
    }
    setUseNum(b: boolean) {
        console.log(`this.useNum : ${b}`)

        this.useNum = b;
    }
    setIncludeFreezedMethod(b: boolean) {
        console.log(`this.includeFreezedMethod : ${b}`)

        this.includeFreezedMethod = b;
    }
    setIncludeOptionalMethod(b: boolean) {
        console.log(`this.includeOptionalMethod : ${b}`)

        this.includeOptionalMethod = b;
    }
    setRequiredProperty(b: boolean) {
        console.log(`this.MAkeRequiredProperty : ${b}`)

        this.makeRequiredProperty = b;
    }
    setFinalProperty(b: boolean) {
        console.log(`this.MAkeFinalProperty : ${b}`)

        this.makeFinalProperty = b;
    }
    putEnCoderAndDeCoder(b: boolean) {
        console.log(`this.putEnCoderAndDeCoder : ${b}`)

        this.putEncoderDeCoder = b;
    }
    setTypesOnlyCode(b: boolean) {
        console.log(`this.typesOnlyCode : ${b}`)

        this.typesOnly = b;
    }


    addClass(className: String, classModel: String) {
        console.log("-----------inside add class method--------");
        console.log(`classname : ${className}`)
        console.log(`classModel : ${classModel}`)

        console.log(this.classModels)
        this.classModels.splice(0, 0, {
            code: classModel,
            className: className,
        });
    }

    findDataType(key: String, value: any,): TypeObj {
        console.log('---------inside findDataType Method-------')
        console.log(`Key : ${key}`)
        console.log(`Value : ${value}`)
        let type = "dynamic" as String;
        const typeObj = new TypeObj();
        if (value === null || value === undefined) {
            console.log('---------inside value === null || value === undefined -------')

            type = this.nullValueDataType;
            typeObj.isPrimitive = true;
        } else if (Number.isInteger(value)) {
            console.log('---------inside Number.isInteger(value)-------')

            type = "int";
            typeObj.isPrimitive = true;
            typeObj.isNum = true;
        } else if ((typeof value) === "number") {
            console.log('---------inside (typeof value) === "number"-------')
            type = "double";
            typeObj.isPrimitive = true;
            typeObj.isNum = true;
        } else if ((typeof value) === "string") {
            console.log('---------inside typeof value) === "string"-------')
            type = "String";
            typeObj.isPrimitive = true;
        } else if ((typeof value) === "boolean") {
            console.log('---------inside (typeof value) === "boolean"-------')

            type = "bool";
            typeObj.isPrimitive = true;
        }
        else if (value instanceof Array) {
            console.log('---------inside value instanceof Array-------')

            const temp = value as Array<any>;
            typeObj.isArray = true;
            if (temp.length === 0) {
                console.log('---------inside Array.lenth === 0-------')

                type = "List<dynamic>";
            } else {
                console.log('---------inside array else condition -------')
                console.log(`this.findDataType(key :${key},value : ${temp[0]})`)
                var newKey = key;
                if (key.endsWith('s')) {
                    newKey = key.slice(0, -1);
                }
                const _type = this.findDataType(newKey, temp[0]);
                console.log(`_type : ${JSON.stringify(_type)}`)
                typeObj.typeRef = _type;
                typeObj.isPrimitive = _type.isPrimitive;
                type = `List<${_type.type}>`;
            }
        } else if ((typeof value) === "object") {
            console.log('---------inside (typeof value) === "object" -------')
            typeObj.isObject = true;
            type = this.toClassName(key);
            console.log(` type = this.toClassName(${key})`)

            this.parse(type, value);
            console.log(` this.parse(${type}, ${value});`)

        }
        typeObj.type = type;
        console.log(`----final TypeObj : ${typeObj}`)
        return typeObj;
    }
    removeNull = (obj: any): any =>
        Object.keys(obj)
            .filter(key => obj[key] !== null)
            .reduce((res, key) => ({ ...res, [key]: obj[key] }), {});

    formatType(type: String, handlerSymbol: String) {
        console.log(`-------- inside Format type: ${type}, handlerSymbol: ${handlerSymbol}`)
        if (type === "dynamic") { return type; }
        return `${type}${handlerSymbol}`;
    }
    parse(className: String, json: any): Result[] {
        console.log("-----------inside parse method --------");

        console.log(`ClassName : ${className}`)
        console.log(`Json : ${JSON.stringify(json)}`)
        className = this.toClassName(className);
        console.log(`toClassname : ${className}`)

        this.classNames.push(className);
        const parameters: String[] = [];
        const parametersForMethod: String[] = [];
        const fromJsonCode: String[] = [];
        const toJsonCode: String[] = [];
        const constructorInit: String[] = [];
        const copyWithAssign: String[] = [];
        const freezedConstructorCodes: String[] = [];
        // const typesOnlyCodes : String[]=[];
        if (json) {
            if (Array.isArray(json) && json.length > 0) {
                console.log("-----------inside json is Array and Json.lenth >0--------");

                json = this.mergeArrayApproach ? json.reduce((p, c) => {
                    return {
                        ...p,
                        ...this.removeNull(c),
                    };
                }, {}) : json[0];
                console.log(`After Merge Array Approach : json : ${json}`)
            }
            Object.entries(json).forEach(entry => {
                console.log("---------inside Boject.entries.foreach method--------")
                console.log(`entry : ${entry}`)
                console.log(`key : ${entry[0]}`)
                console.log(`value : ${JSON.stringify(entry[1])}`)
                const key = entry[0];
                const value = entry[1];
                const typeObj = this.findDataType(key, value);
                console.log(`TypeObj : ${JSON.stringify(typeObj)}`)
                const type = this.formatType(typeObj.type, this.handlerSymbol);
                console.log(`Type : ${type}`)

                const paramName = camelcase(key);
                console.log(`paramName : ${paramName}`)
                var final = this.makeFinalProperty ? 'final' : '';

                parameters.push(this.toCode(1, final, type, paramName));
                console.log(`parameters.push: ${parameters}`)

                this.addFromJsonCode(key, typeObj, fromJsonCode);
                this.addToJsonCode(key, typeObj, toJsonCode);
                if (this.includeCopyWitMethod) {
                    console.log("---------inside this.includeCopyWitMethod--------")
                    // var newType = `${type}?`;
                    parametersForMethod.push(this.toMethodParams(2, type + '?', paramName));
                    copyWithAssign.push(`${this.indent(2)}${paramName}: ${paramName} ?? this.${paramName}`);
                }
                constructorInit.push(`${this.makeRequiredProperty ? 'required' : ''} this.${paramName}`);
                freezedConstructorCodes.push(this.toMethodParams(2,`${this.makeRequiredProperty ? 'required' : ''}`,typeObj.type, paramName));
            });
        }

        const fromListCode = this.includeFromListMethod ?
            `
${this.indent(1)}static List<${className}> fromList(List<Map<String, dynamic>> list) {
${this.indent(2)}return list.map((map) => ${className}.fromJson(map)).toList();
${this.indent(1)}}
` : "";
        const encoderAndDecoderCode = this.putEncoderDeCoder ?
            `${this.indent(1)}factory  ${className}.fromRawJson(String str) => ${className}.fromJson(json.decode(str));

${this.indent(1)}String toRawJson() => json.encode(toJson());

` : "";
        const freezedCode = `
@freezed
class ${className} with _$${className} {
${this.indent(1)}const factory ${className}(${constructorInit.length ? `{
${freezedConstructorCodes.join('\n')}
${this.indent(1)}}`: ""})= _${className};

${this.indent(1)}factory ${className}.fromJson(Map<String, dynamic> json)  => _$${className}FromJson(json);
}
`;

        const copyWithCode = this.includeCopyWitMethod ?
            `

${this.indent(1)}${className} copyWith({
${parametersForMethod.join("\n")}
${this.indent(1)}}) => ${className}(${copyWithAssign.length ? `
${copyWithAssign.join(",\n")},
${this.indent(1)}` : ""});` : '';

        const parametersCode = parameters.length ? `
${parameters.join("\n")}
`: "";
const typesOnlyCode =`
class ${className} {${parametersCode}
${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});
}`;
        const code = `
class ${className} {${parametersCode}
${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});

${this.indent(1)}factory ${className}.fromJson(Map<String, dynamic> json) {
${fromJsonCode.join("\n")}
${this.indent(1)}}
${fromListCode}
${encoderAndDecoderCode}
${this.indent(1)}Map<String, dynamic> toJson() {
${this.indent(2)}final Map<String, dynamic> _data = <String, dynamic>{};
${toJsonCode.join("\n")}
${this.indent(2)}return _data;
${this.indent(1)}}${this.includeCopyWitMethod ? copyWithCode : ""}
}`;
console.log(`typesonly : ${this.typesOnly}`);
        this.addClass(className, this.includeFreezedMethod ? freezedCode : this.typesOnly ? typesOnlyCode : code);

//         const packages =
//             `${this.putEncoderDeCoder ? `import 'dart:convert';` : ""}
// ${this.includeFreezedMethod ? `
// import 'package:freezed_annotation/freezed_annotation.dart';
// part 'welcome.freezed.dart';
// part 'welcome.g.dart';`: ''}
// `;
        // this.addClass('packages',packages);
        console.log(`/-/-/-/-/-/-/-/-/-/-/-/-return classModels-/-/-//-/-/-/-/-/-`);
        return this.classModels;

    }


    toClassName(name: String): String {
        name = camelcase(name, { pascalCase: true });
        let i = 0;
        let className = name;
        while (this.classNames.includes(className)) {
            ++i;
            className = `${name}${i}`;
        }

        return className;
    }

    r = (type: TypeObj): String => {
        console.log(`----------inside r = (type: ${type})----------- `)

        if (type.typeRef !== undefined) {
            return `(e) => e == null?[]:(e as List).map(${this.r(type.typeRef)}).toList()`;
        }
        return `(e) => ${type.type}.fromJson(e)`;
    };


    p = (type: TypeObj): String => {
        console.log(`----------inside p = (type: ${JSON.stringify(type)})----------- `)

        if (type.typeRef !== undefined) {
            return `(e) => e?.map(${this.p(type.typeRef)})?.toList() ?? []`;
        }
        return `(e) => e.toJson()`;
    };

    addFromJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        console.log("----------inside AddFromJsonCode----------- ")
        console.log(`addFromJsonCode(key: ${key}, typeObj: ${typeObj}, fromJsonCode: ${fromJsonCode}`)
        const type = typeObj.type;
        const paramName = `${camelcase(key)}`;
        let indentTab = 2;
        if (this.shouldCheckType && type !== "dynamic") {
            console.log("----------inside this.shouldCheckType && type !== dynamic----------- ")

            indentTab = 3;
            if (typeObj.isObject) {
                console.log("----------inside typeObj.isObject----------- ")

                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is Map) {`));
            } else if (typeObj.isArray) {
                console.log("----------inside typeObj.isArray----------- ")

                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is List) {`));
            } else if (this.useNum && typeObj.isNum) {
                console.log("----------inside this.useNum && typeObj.isNum----------- ")

                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is num) {`));
            }
            else {
                console.log("----------inside Else condition----------- ")

                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is ${type}) {`));
            }
        }
        if (typeObj.isObject) {
            console.log("----------inside typeObj.isObject----------- ")

            fromJsonCode.push(this.toCode(indentTab,
                paramName, "=", `json["${key}"] == null ? null : ${type}.fromJson(json["${key}"])`));
            console.log(`froMJsonCode :${fromJsonCode}`)
        }

        else if (typeObj.isArray) {
            console.log("----------inside typeObj.isArray----------- ")

            if (typeObj.typeRef === undefined) {
                console.log("----------inside typeObj.typeRef === undefined----------- ")
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] ?? []`));
            } else if (typeObj.isPrimitive) {
                console.log("----------inside typeObj.isPrimitive----------- ")

                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : List<${typeObj.typeRef.type}>.from(json["${key}"])`));
            } else {
                console.log("----------inside else condition in typeobj.array----------- ")

                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : (json["${key}"] as List).map(${this.r(typeObj.typeRef)}).toList()`));
            }
        }
        else {
            if (this.useNum && typeObj.isNum) {
                console.log("----------inside this.useNum && typeObj.isNum----------- ")

                const methodName = camelcase(type, { pascalCase: true });
                fromJsonCode.push(this.toCode(indentTab, paramName, "=", `(json["${key}"] as num).to${methodName}()`));
            }
            else {
                console.log("----------inside else condition in this.usenum----------- ")

                fromJsonCode.push(this.toCode(indentTab, paramName, "=", `json["${key}"]`));
            }
        }

        if (indentTab === 3) {
            fromJsonCode.push(this.toCondition(2, `}`));
        }
    }

    addToJsonCode(key: String, typeObj: TypeObj, fromJsonCode: Array<String>) {
        console.log(`----------inside  addToJsonCode(key: ${key}, typeObj: ${JSON.stringify(typeObj)}, fromJsonCode: ${fromJsonCode})----------- `)

        const paramName = `${camelcase(key)}`;
        const paramCode = `_data["${key}"]`;
        if (typeObj.isObject) {
            console.log("----------inside typeObj.isObject in tojson----------- ")
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null) {`));
            fromJsonCode.push(this.toCode(3,
                paramCode, "=", `${paramName}${this.handlerSymbol}.toJson()`));
            fromJsonCode.push(this.toCondition(2, `}`));
        }
        else if (typeObj.isArray) {
            console.log("----------inside typeObj.isArray in tojson----------- ")

            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null) {`));
            if (typeObj.isPrimitive || typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=", paramName));
            } else {
                fromJsonCode.push(this.toCode(3,
                    paramCode, "=",
                    `${paramName}${this.handlerSymbol}.map(${this.p(typeObj.typeRef)}).toList()`));
            }
            fromJsonCode.push(this.toCondition(2, `}`));
        }
        else {
            fromJsonCode.push(this.toCode(2,
                paramCode, "=", paramName));
        }
    }


    indent(count: number): String {
        return this.indentText.repeat(count);
    }

    toCode(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")};`;
    }
    toMethodParams(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")},`;
    }

    toCondition(count: number, ...text: Array<String>): String {
        return `${this.indent(count)}${text.join(" ")}`;
    }
}


class TypeObj {
    type: String = "dynamic";
    defaultValue: String = "''";
    typeRef!: TypeObj;
    isObject: boolean = false;
    isArray: boolean = false;
    isPrimitive: boolean = false;
    isNum: boolean = false;
}

export type Result = {
    code: String;
    className: String;
};



export default JsonToDart;
