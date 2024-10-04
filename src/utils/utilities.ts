
function _getFormattedClassName(name: string) {
	return name.split('_').map(word => word[0].toLocaleUpperCase() + word.substring(1)).join('');
}

function _getFormattedTypeName(name: string) {
	return name.split('_').map(word => word[0].toLocaleLowerCase() + word.substring(1)).join('');
}

export var getFormattedClassName = _getFormattedClassName;
export var getFormattedTypeName = _getFormattedTypeName;