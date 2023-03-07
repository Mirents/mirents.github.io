import { log } from "../../utils.js";
import { ERROR_MESSAGE, INFO_MESSAGE, WARN_MESSAGE, SUCCESS_MESSAGE, FILE_OPTIONS } from "../../consts.js";

import { importOpener } from "./opener.js";

document.addEventListener('DOMContentLoaded', function() {
	document.querySelector('#drop-area').addEventListener('dragover', (event) => {
		event.stopPropagation();
		event.preventDefault();
		document.querySelector('.overlay').classList.remove('hidden');
		event.dataTransfer.dropEffect = 'copy';
	});
	document.querySelector('#drop-area').addEventListener('drop', async (event) => {
		event.stopPropagation();
		event.preventDefault();
		document.querySelector('.overlay').classList.add('hidden');
		var fileList = event.dataTransfer.files;
		var file = fileList[0];
		await opener.openFileAndUpdateData(file);
		send();
	});
	document.querySelector('.overlay').addEventListener('dragleave', (event) => {
		event.stopPropagation();
		event.preventDefault();
		document.querySelector('.overlay').classList.add('hidden');
	});
	
	/*document.addEventListener('click', function(e) {
		var checkboxes = document.querySelector('#checkboxes');
		log('e !== checkboxes === ' + (e.target !== checkboxes));
		if (expanded && e.target !== checkboxes) {
			checkboxes.style.display = "none";
			expanded = false;
		}
	}, false);*/
});

//let opener = new Opener();
let opener = importOpener;

// Пересылка ообщений внутри расширения
function send() {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs){
		log('options -> XXX: Отправлено сообщение: X1');
		chrome.tabs.sendMessage(tabs[0].openerTabId, { textmessage: "X1" }, function (response) {
			log('XXX -> options: Получен ответ на X1: ' + response.textmessage);
		});
	});
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs){
		log('options -> XXX: Отправлено сообщение: X2');
		chrome.tabs.sendMessage(tabs[0].id, { textmessage: "X2" }, function (response) {
			log('XXX -> options: Получен ответ на X2: ' + response.textmessage);
		});
	});
}