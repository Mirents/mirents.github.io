import { log } from "../utils/utils.js";
import { ERROR_MESSAGE, INFO_MESSAGE, WARN_MESSAGE, SUCCESS_MESSAGE, FILE_OPTIONS } from "../libs/consts.js";

export function showMessage(text, color) {
	var snachbarPlace = document.querySelector('.snackbar-place');
	snachbarPlace.innerHTML = '';
	
	snachbarPlace.insertAdjacentHTML('beforeend', createSnackbar());
	var x = document.getElementById('snackbar');
	x.innerHTML = text;
	x.style.background = color['backgroundColor'];
	x.style.borderLeft = color['borderLeft'];
	x.className = "show";
	setTimeout(function () {x.className = x.className.replace("show", ""); }, 4000);
}

export function createSnackbar() {
	return `<div id="snackbar"></div>`;
}

export function createCustomElement(type, textContent, attributes) {
	var result = document.createElement(type);
	if (textContent && textContent !== '') {
		result.textContent = textContent;
	}
	if (attributes && attributes.length > 0) {
		for (var key in attributes) {
			var attribute = attributes[key];
			var name = attribute['name'];
			var value = attribute['value'];
			result.setAttribute(name, value);
		}
	}
	return result;
}