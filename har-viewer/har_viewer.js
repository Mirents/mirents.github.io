import { log } from "../utils/utils.js";
import { ERROR_MESSAGE, INFO_MESSAGE, WARN_MESSAGE, SUCCESS_MESSAGE, FILE_OPTIONS } from "../libs/consts.js";

import Opener from '../utils/opener.js';

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

let opener = new Opener();