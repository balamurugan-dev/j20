import { getFormattedTypeName, getFormattedClassName } from "../utilities";

export default class JsonToDart {
    classNames: Array<string> = [];
    classModels: Array<Result> = [];
    indentText: string;
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
    typesOnly: boolean = false;
    useNum: boolean = false;
    nullValueDataType: string;
    handlerSymbol: string;
    constructor(tabSize: number, shouldCheckType?: boolean, nullValueDataType?: string, nullSafety?: boolean) {
        this.indentText = " ".repeat(tabSize);
        this.shouldCheckType = shouldCheckType ?? false;
        this.nullValueDataType = nullValueDataType ?? "dynamic";
        this.nullSafety = nullSafety ?? true;
        this.handlerSymbol = nullSafety ? "?" : "";
    }

    setIncludeCopyWithMethod(b: boolean) {
        this.includeCopyWitMethod = b;
    }
    setIncludeFromListWithMethod(b: boolean) {
        this.includeFromListMethod = b;
    }
    setMergeArrayApproach(b: boolean) {
        this.mergeArrayApproach = b;
    }
    setUseNum(b: boolean) {
        this.useNum = b;
    }
    setIncludeFreezedMethod(b: boolean) {
        this.includeFreezedMethod = b;
    }
    setIncludeOptionalMethod(b: boolean) {
        this.includeOptionalMethod = b;
    }
    setRequiredProperty(b: boolean) {
        this.makeRequiredProperty = b;
    }
    setFinalProperty(b: boolean) {
        this.makeFinalProperty = b;
    }
    putEnCoderAndDeCoder(b: boolean) {
        this.putEncoderDeCoder = b;
    }
    setTypesOnlyCode(b: boolean) {
        this.typesOnly = b;
    }


    addClass(className: string, classModel: string) {
        this.classModels.splice(0, 0, {
            code: classModel,
            className: className,
        });
    }

    findDataType(key: string, value: any,): TypeObj {
        let type = "dynamic" as string;
        const typeObj = new TypeObj();
        if (value === null || value === undefined) {
            type = this.nullValueDataType;
            typeObj.isPrimitive = true;
        } else if (Number.isInteger(value)) {
            type = "int";
            typeObj.isPrimitive = true;
            typeObj.isNum = true;
        } else if ((typeof value) === "number") {
            type = "double";
            typeObj.isPrimitive = true;
            typeObj.isNum = true;
        } else if ((typeof value) === "string") {
            type = "String";
            typeObj.isPrimitive = true;
        } else if ((typeof value) === "boolean") {
            type = "bool";
            typeObj.isPrimitive = true;
        }
        else if (value instanceof Array) {
            var temp = value as Array<any>;
            typeObj.isArray = true;


            if (temp.length === 0) {
                type = "List<dynamic>";
            } else {

                temp = this.mergeArrayApproach ?
                 this.merchList(temp): temp[0];

                var newKey = key;
                if (key.endsWith('s')) {
                    newKey = key.slice(0, -1);
                }
                const _type = this.findDataType(newKey, temp);
                typeObj.typeRef = _type;
                typeObj.isPrimitive = _type.isPrimitive;
                type = `List<${_type.type}>`;
            }
        } else if ((typeof value) === "object") {
            typeObj.isObject = true;
            type = this.toClassName(key);
            this.parse(type, value);
        }
        typeObj.type = type;
        return typeObj;
    }
    merchList  (list:any[]) : any {
       const mergedObject =  list.reduce((p, c) => {
            Object.keys(c).forEach((key: string) => {
              const value = c[key];
              const existingValue = p[key];
          
              if (value === null) {
                if (existingValue !== undefined && existingValue !== null) return;
                p[key] = null;
              } else if (Array.isArray(value)) {
                if (Array.isArray(existingValue)) {
                  p[key] = [...existingValue, ...value].filter(v => v !== undefined && v !== null);
                } else {
                  p[key] = value;
                }
              } else if (value !== null) {
                p[key] = value;
              }
            });
          
            return p;
          }, {});
          
          Object.keys(mergedObject).forEach((key: string) => {
            if (Array.isArray(mergedObject[key]) && mergedObject[key].length === 0) {
              mergedObject[key] = []; 
            } else if (mergedObject[key] === null) {
              mergedObject[key] = null;
            }
          });
          return mergedObject;

    }

    removeEmptyArray = (obj: any): any =>
        Object.keys(obj)
            .filter(key => !(Array.isArray(obj[key]) && obj[key].length === 0))
            .reduce((res, key) => ({ ...res, [key]: obj[key] }), {});
    removeNull = (obj: any): any =>
        Object.keys(obj)
            .filter(key => obj[key] !== null)
            .reduce((res, key) => ({ ...res, [key]: obj[key] }), {});

    formatType(type: string, handlerSymbol: string) {
        if (type === "dynamic") { return type; }
        return `${type}${handlerSymbol}`;
    }
    parse(className: string, json: any): Result[] {
        className = this.toClassName(className);
        this.classNames.push(className);
        const parameters: string[] = [];
        const parametersForMethod: string[] = [];
        const fromJsonCode: string[] = [];
        const toJsonCode: string[] = [];
        const constructorInit: string[] = [];
        const copyWithAssign: string[] = [];
        const freezedConstructorCodes: string[] = [];
        // const typesOnlyCodes : String[]=[];
        if (json) {
            if (Array.isArray(json) && json.length > 0) {
                json = this.mergeArrayApproach ? json.reduce((p, c) => {
                    return {
                        ...p,
                        ...this.removeNull(c),
                    };
                }, {}) : json[0];
            }
            Object.entries(json).forEach(entry => {
                const key = entry[0];
                const value = entry[1];
                const typeObj = this.findDataType(key, value);
                const type = this.formatType(typeObj.type, this.handlerSymbol);
                const paramName = getFormattedTypeName(key);
                var final = this.makeFinalProperty ? 'final' : '';
                parameters.push(this.toCode(1, final, type, paramName));
                this.addFromJsonCode(key, typeObj, fromJsonCode);
                this.addToJsonCode(key, typeObj, toJsonCode);
                if (this.includeCopyWitMethod) {
                    let newType = type.includes('?') ? type : type + '?';
                    parametersForMethod.push(this.toMethodParams(2, newType, paramName));
                    copyWithAssign.push(`${this.indent(2)}${paramName}: ${paramName} ?? this.${paramName}`);
                }
                constructorInit.push(`${this.makeRequiredProperty ? 'required' : ''} this.${paramName}`);
                freezedConstructorCodes.push(this.toMethodParams(2, `${this.makeRequiredProperty ? 'required' : ''}`, this.makeRequiredProperty ? typeObj.type : this.formatType(typeObj.type,'?'), paramName));
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
${this.indent(1)}}` : ""})= _${className};

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
        const typesOnlyCode = `
class ${className} {${parametersCode}
${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});
}`;
        const code = `
class ${className} {${parametersCode}
${this.indent(1)}${className}(${constructorInit.length ? `{${constructorInit.join(", ")}}` : ""});

${this.indent(1)}${className}.fromJson(Map<String, dynamic> json) {
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
        this.addClass(className, this.includeFreezedMethod ? freezedCode : this.typesOnly ? typesOnlyCode : code);

        return this.classModels;

    }


    toClassName(name: string): string {
        name = getFormattedClassName(name);
        let i = 0;
        let className = name;
        while (this.classNames.includes(className)) {
            ++i;
            className = `${name}${i}`;
        }

        return className;
    }

    r = (type: TypeObj): string => {

        if (type.typeRef !== undefined) {
            return `(e) => e == null?[]:(e as List).map(${this.r(type.typeRef)}).toList()`;
        }
        return `(e) => ${type.type}.fromJson(e)`;
    };


    p = (type: TypeObj): string => {
        if (type.typeRef !== undefined) {
            return `(e) => e?.map(${this.p(type.typeRef)})?.toList() ?? []`;
        }
        return `(e) => e.toJson()`;
    };

    addFromJsonCode(key: string, typeObj: TypeObj, fromJsonCode: Array<string>) {
        const type = typeObj.type;
        const paramName = `${getFormattedTypeName(key)}`;
        let indentTab = 2;
        if (this.shouldCheckType && type !== "dynamic") {
            indentTab = 3;
            if (typeObj.isObject) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is Map) {`));
            } else if (typeObj.isArray) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is List) {`));
            } else if (this.useNum && typeObj.isNum) {
                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is num) {`));
            }
            else {

                fromJsonCode.push(this.toCondition(2, `if(json["${key}"] is ${type}) {`));
            }
        }
        if (typeObj.isObject) {

            fromJsonCode.push(this.toCode(indentTab,
                paramName, "=", `json["${key}"] == null ? null : ${type}.fromJson(json["${key}"])`));
        }

        else if (typeObj.isArray) {

            if (typeObj.typeRef === undefined) {
                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] ?? []`));
            } else if (typeObj.isPrimitive) {

                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : List<${typeObj.typeRef.type}>.from(json["${key}"])`));
            } else {

                fromJsonCode.push(this.toCode(indentTab,
                    paramName, "=", `json["${key}"] == null ? null : (json["${key}"] as List).map(${this.r(typeObj.typeRef)}).toList()`));
            }
        }
        else {
            if (this.useNum && typeObj.isNum) {

                const methodName = getFormattedClassName(type);
                fromJsonCode.push(this.toCode(indentTab, paramName, "=", `(json["${key}"] as num).to${methodName}()`));
            }
            else {

                fromJsonCode.push(this.toCode(indentTab, paramName, "=", `json["${key}"]`));
            }
        }

        if (indentTab === 3) {
            fromJsonCode.push(this.toCondition(2, `}`));
        }
    }

    addToJsonCode(key: string, typeObj: TypeObj, fromJsonCode: Array<string>) {
        const paramName = `${getFormattedTypeName(key)}`;
        const paramCode = `_data["${key}"]`;
        if (typeObj.isObject) {
            fromJsonCode.push(this.toCondition(2, `if(${paramName} != null) {`));
            fromJsonCode.push(this.toCode(3,
                paramCode, "=", `${paramName}${this.handlerSymbol}.toJson()`));
            fromJsonCode.push(this.toCondition(2, `}`));
        }
        else if (typeObj.isArray) {
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


    indent(count: number): string {
        return this.indentText.repeat(count);
    }

    toCode(count: number, ...text: Array<string>): string {
        return `${this.indent(count)}${text.join(" ")};`;
    }
    toMethodParams(count: number, ...text: Array<string>): string {
        return `${this.indent(count)}${text.join(" ")},`;
    }

    toCondition(count: number, ...text: Array<string>): string {
        return `${this.indent(count)}${text.join(" ")}`;
    }
}


class TypeObj {
    type: string = "dynamic";
    defaultValue: string = "''";
    typeRef!: TypeObj;
    isObject: boolean = false;
    isArray: boolean = false;
    isPrimitive: boolean = false;
    isNum: boolean = false;
}

export type Result = {
    code: string;
    className: string;
};

