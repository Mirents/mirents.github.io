const ERROR_MESSAGE   = { "backgroundColor": '#FFDDDD', "borderLeft": '6px solid #F44336' };
const INFO_MESSAGE    = { "backgroundColor": '#E7F3FE', "borderLeft": '6px solid #2196F3' };
const WARN_MESSAGE    = { "backgroundColor": '#FFFFCC', "borderLeft": '6px solid #FFEB3B' };
const SUCCESS_MESSAGE = { "backgroundColor": '#DDFFDD', "borderLeft": '6px solid #04AA6D' };

const FILE_OPTIONS = { types: [{ description: "json and txt files", accept: { "text/plain": [".json", ".txt"] } }] };

export class Opener {
	validUrls = ['c.amazon-adsystem.com', 'static.wikia.nocookie.net'];
	entriesData = new Array();
	entriesDataFiltering = new Array();
	activeRequestMethods = new Array();
	activeResponseStatuses = new Array();
	
	async openFileAndUpdateData(file) {
		if (file.name.includes('.har')) {
			var text = await this.parseFile(file);
			this.openHarFile(text);
		} else if (file.name.includes('.log')) {
			
		} else if (file.name.includes('.json')) {
			var text = await this.parseFile(file);
			this.test(text)
		} else {
			document.querySelector('.overlay').classList.remove('hidden');
			showMessage("Некорректный тип файла", ERROR_MESSAGE);
		}
	}
	
	openHarFile(text) {
		var obj = JSON.parse(text);
		var entries = obj['log']['entries'];
		this.entriesData = entries;
		this.activeRequestMethods = this.updateActivites('request.method');
		this.activeResponseStatuses = this.updateActivites('response.status');
		
		createListResponseStatusCodes('dropdownRequestMethod', "dropdownItemRequestMethods", 'Methods HTTP(S) request', this.activeRequestMethods);
		createListResponseStatusCodes('dropdownResponseStatuses', "dropdownItemResponseStatuses", 'Response Status', this.activeResponseStatuses);
		
		// Добавить разделитель
		var liDivider = createCustomElement('li', '', []);
		var hr = createCustomElement('hr', '', [ {"name":"class", "value":"dropdown-divider"} ]);
		document.querySelector('.navbar-nav').append(hr);
		
		createTextListFiltersBlock('urlTextFilter', 'Enter Text');

		createBottomElementsForOffcanvas();
		
		document.querySelector('#buttonConfirm').addEventListener('click', function() { updateFilters(opener) });
		
		updateFilters(this);
	}
	
	updateActivites(key) {
		var result = new Array();
		for (var i = 0; i < this.entriesData.length; i++) {
			var value = getValueToPath(key, this.entriesData[i]);
			if (!Object.values(result).includes(value)) {
				result.push(value);
			}
		}
		
		return result;
	}
	
	test(text) {
		var obj = JSON.parse(text);
		//console.log(obj)
		var result = this.getObjectKeys(obj, new Array());
		for (var key in result) {
			log(result[key]);
		}
	}
	
	// Метод разбора объекта на пути
	getObjectKeys(obj, keysResult, level) {
		function getLevel(val1, val2) {
			if (val1 === undefined) {
				return val2;
			} else {
				return val1 + '.' + val2;
			}
		}
		if (obj != null) {
			var keys = Object.keys(obj);
			var length = keys.length;

			if (length !== 0) {
				for (var i = 0; i < length; i++) {
					if (Array.isArray(obj[keys[i]])) {
						this.getObjectKeys(obj[keys[i]], keysResult, getLevel(level, keys[i]));
					} else if (typeof obj[keys[i]] === 'object') {
						if (/\d/.test(keys[i])) {
							this.getObjectKeys(obj[keys[i]], keysResult, level + '[' + keys[i] + ']');
						} else {
							this.getObjectKeys(obj[keys[i]], keysResult, getLevel(level, keys[i]));
						}
					} else {
						keysResult.push(getLevel(level, keys[i]));
					}
				}
			}
		}
		return keysResult;
	}
	
	showData() {
		var entries = this.entriesDataFiltering;
		log('showData entries=' + entries.length)
		for (var key in entries) {
			var entry = entries[key];
			var request = entry['request'];
			var response = entry['response'];
			var url = request['url'];
			var method = request['method'];
			
			if (this.isValidUrl(url)) {
				var postData = request['postData'];
				var textToRequest = '';
				var mimeTypeRequest = '';
				if (postData !== undefined) {
					if (method === 'POST' && postData?.mimeType) {
						mimeTypeRequest = postData['mimeType'];
					}
					if (mimeTypeRequest.includes('application/x-www-form-urlencoded')) {
						textToRequest = mimeTypeRequest + '\n' + postData['text'];
					} else if (mimeTypeRequest.includes('application/json') || mimeTypeRequest.includes('text/plain')) {
						var text = postData['text'];
						textToRequest = this.prettyJson(text);
					}
				}

				var startedDateTime = entry['startedDateTime'];
				var content = response['content'];
				var textToResponse = '';
				var mimeTypeResponse = content['mimeType'];
				var statusResponse = response['status'];
				if (content !== undefined) {
					if (mimeTypeResponse.includes('application/json') || mimeTypeResponse.includes('text/plain')) {
						var text = content['text'];
						textToResponse = this.prettyJson(text);
					} else if (mimeTypeResponse.includes('javascript') || mimeTypeResponse.includes('text/html') || mimeTypeResponse.includes('image')) {
						textToResponse = content['text'];
					} else {
						log('Unknown data type Response: ' + mimeTypeResponse);
					}
				}
				
				document.querySelector('#data').append(
					this.createDataBlockMethodNew(
						startedDateTime,
						method,
						url,
						textToRequest,
						textToResponse,
						mimeTypeRequest,
						mimeTypeResponse,
						statusResponse));
			}
		}
	}
	
	parseFile(file) {
		return new Promise(
			(resolve, reject) => {
				let content = '';
				const reader = new FileReader();
				reader.onloadend = function (e) {
					content = e.target.result;
					showMessage("Успешное открытие файла", SUCCESS_MESSAGE);
					resolve(content);
				};
				reader.onerror = function (e) {
					showMessage("Ошибка открытия файла", ERROR_MESSAGE);
					reject(e);
				};
				reader.readAsText(file);
			});
	}
	
	clearData() {
		document.querySelector('#data').innerHTML = '';
	}
	
	isValidUrl(url) {
		return true;
		for (var key in this.validUrls) {
			if (url.includes(this.validUrls[key])) {
				return true;
			}
		}
		return false;
	}

	prettyJson(json) {
		var result;
		try {
			json = JSON.parse(json);
			result = JSON.stringify(json, null, 2);
		} catch(e) {
			result = json;
		}
		
		return result;
	}
	
	createDataBlockMethodNew(startedDateTime, method, url, requestText, responseText, mimeTypeRequest, mimeTypeResponse, statusResponse) {
		var divCard = createCustomElement('div', '', [ {"name":"class", "value":"card"},
			{"name":"style", "value":"margin: 10px;"} ]);
		
		var divCardBody = createCustomElement('div', '', [ {"name":"class", "value":"card-body"} ]);
		divCard.append(divCardBody);
		
		var header =  createCustomElement('div', '', [ {"name":"class", "value":"card-title sansserif"} ]);
		var urlWithoutQueryParams = /.*\/([^?]+)/.exec(url)[0];
		header.textContent = method + ': ' + statusResponse + ' to url ' + urlWithoutQueryParams;
		divCardBody.append(header);
		
		if (requestText !== '') {
			divCardBody.append(this.getDetailsBlock('Request Body - ' + mimeTypeRequest, requestText));
		}
		
		if (responseText !== '') {
			divCardBody.append(this.getDetailsBlock('Response Body - ' + mimeTypeResponse, responseText));
		}
		
		return divCard;
	}
	
	createDataBlockMethod(startedDateTime, method, url, requestText, responseText, mimeTypeRequest, mimeTypeResponse, statusResponse) {
		var result = document.createElement('div');
		result.className = "global_block";
		
		var header = document.createElement('h4');
		header.className = "sansserif";
		var urlWithoutQueryParams = /.*\/([^?]+)/.exec(url)[0];
		header.textContent = method + ': ' + statusResponse + ' to url ' + urlWithoutQueryParams;
		result.append(header);
		
		if (requestText !== '') {
			result.append(this.getDetailsBlock('Request Body - ' + mimeTypeRequest, requestText));
		}
		
		if (responseText !== '') {
			result.append(this.getDetailsBlock('Response Body - ' + mimeTypeResponse, responseText));
		}
		
		return result;
	}
	
	getDetailsBlockNew(name, text) {
		var pResult = createCustomElement('p');
		
		var button = createCustomElement('button', name, [ {"name":"class", "value":"btn btn-primary btn-sm"},
			{ "name":"type", 			"value":"button"},
			{ "name":"data-bs-toggle",  "value":"collapse"},
			{ "name":"data-bs-target",  "value":"#collapseRequest"},
			{ "name":"aria-expanded",   "value":"false"},
			{ "name":"aria-controls",   "value":"collapseRequest"} ]);
		pResult.append(button);
		
		var a = createCustomElement('a', 'Save', [ {"name":"class", "value":"btn btn-secondary btn-sm"} ]);
		pResult.append(a);

		var p = createCustomElement('p');
		var divCollapse = createCustomElement('div', '', [ { "name":"class", "value":"collapse" },
			{ "name":"id", "value":"collapseRequest" } ]);
		p.append(divCollapse);
		
		var divText = createCustomElement('div', text, [ { "name":"class", "value":"card card-body" } ]);
		divCollapse.append(divText);
		pResult.append(p);
		
		return pResult;
	}
	
	getDetailsBlock(name, text) {
		var details = document.createElement('details');
		
		var summary = document.createElement('summary');
		summary.className = "sansserif";
		summary.textContent = name;
		details.append(summary);
		
		var pre = document.createElement('pre');
		pre.setAttribute('id','block_request');
		var code = document.createElement('code');
		code.textContent = text;
		pre.append(code);
		
		details.append(pre);
		
		return details;
	}

	filter(filters) {
		this.entriesDataFiltering = this.entriesData;
		console.log(this.entriesDataFiltering)
		for (var key in filters) {
			this.entriesDataFiltering = this.entriesDataFiltering.filter(
				function(o) {
					var value = getValueToPath(key, o).toString();
					if (typeof value === 'number') {
						return Object.values(filters[key]).includes(value);
					} else if (typeof value === 'string') {
						return Object.values(filters[key]).includes(value.toLowerCase());
					} else {
						log('Для значения "' + value +'" отсутствует обработка типа данных')
					}
				}
			);
		}
		console.log(this.entriesDataFiltering)
	}
	
	filterContainsText(path, filter) {
		if (filter.length > 0) {
			this.entriesDataFiltering = this.entriesDataFiltering.filter(
				function(o) {
					var value = getValueToPath(path, o).toString();
					var isIncludes = false;
					for (var key in filter) {
						isIncludes = value.includes(filter[key]);
						if (isIncludes === true) {
							break;
						}
					}
					return isIncludes;
				}
			);
		}
	}
}

//*********************************************************************************************************************************
function createListResponseStatusCodes(idDropdown, idDropdownItem, header, values) {
	var ul = createCustomElement('ul', '', [ {"name":"class", "value":"dropdown-menu"}, {"name":"aria-labelledby", "value":"offcanvasNavbarDropdown"} ]);
	
	var liUnselectAll = createCustomElement('li', '', []);
	var aUnselectAll = createCustomElement('a', 'Unselect All', [ {"name":"class", "value":"dropdown-item"} ]);
	aUnselectAll.addEventListener('click',
			function(e) {
				unselectAllItems(this);
			});
	liUnselectAll.append(aUnselectAll);
	
	var liSelectAll = createCustomElement('li', '', []);
	var aSelectAll = createCustomElement('a', 'Select All', [ {"name":"class", "value":"dropdown-item"} ]);
	aSelectAll.addEventListener('click',
			function(e) {
				selectAllItems(this, aUnselectAll);
			});
	liSelectAll.append(aSelectAll);

	var liDivider = createCustomElement('li', '', []);
	var hr = createCustomElement('hr', '', [ {"name":"class", "value":"dropdown-divider"} ]);
	liDivider.append(hr);
	
	ul.append(liSelectAll);
	ul.append(liUnselectAll);
	ul.append(liDivider);
	
	for (var key in values) {
		var li = createCustomElement('li', '', []);
		var a = createCustomElement('a', values[key], [ {"name":"class", "value":"dropdown-item active"}, {"name":"id", "value":idDropdownItem} ]);
		a.addEventListener('click',
			function(e) {
				selectAndUnselectItem(this);
			});
		li.append(a);
		ul.append(li);
	}
	
	var liNavItemDropdown = createCustomElement('li', '', [ {"name":"class", "value":"nav-item dropdown"}, {"name":"id", "value":idDropdown} ]);
	var aNavLinkDropdownToggle = createCustomElement('a', header,
		[ {"name":"class", "value":"nav-link dropdown-toggle"},
		{"name":"href", "value":"#"},
		{"name":"id", "value":"offcanvasNavbarDropdown"},
		{"name":"role", "value":"button"},
		{"name":"data-bs-toggle", "value":"dropdown"},
		{"name":"data-bs-auto-close", "value":"outside"},
		{"name":"aria-expanded", "value":"false"} ]);
	liNavItemDropdown.append(aNavLinkDropdownToggle);
	liNavItemDropdown.append(ul);

	document.querySelector('.navbar-nav').append(liNavItemDropdown);
	// TODO Перенести в другое место
	document.querySelector('#buttonFilters').classList.remove('disabled');
}

function selectAndUnselectItem(target) {
	if (target.classList.contains('active')) {
		target.classList.remove('active');
	} else {
		target.classList.add('active');
	}
}

function selectAllItems(targetSelect, targetUnselect) {
	var elements = targetSelect.parentNode.parentNode.querySelectorAll('.dropdown-item')
	
	for (var i = 0; i < elements.length; i++) {
		if (!targetSelect.isEqualNode(elements[i])
			&& !targetUnselect.isEqualNode(elements[i])
			&& elements[i].classList.contains('active') === false) {
			elements[i].classList.add('active');
		}
	}
}

function unselectAllItems(target) {
	var elements = target.parentNode.parentNode.querySelectorAll('.dropdown-item')
	
	for (var i = 0; i < elements.length; i++) {
		if (!target.isEqualNode(elements[i]) && elements[i].classList.contains('active')) {
			elements[i].classList.remove('active');
		}
	}
}
//*********************************************************************************************************************************

function getValueToPath(path, object) {
	var obj = object;
	var path = path.split('.');
	for (var i = 0; i < path.length ; i++) {
		obj = obj[path[i]];
	}

	return obj;
}

function updateFilters(obj) {
	var elementsRequestMethods = document.querySelectorAll('#dropdownItemRequestMethods');
	var len = elementsRequestMethods.length;
	var filtersRequestMethod = new Array();
	var filters = {};
		
	for (var i = 0; i < len; i++) {
		if (elementsRequestMethods[i]['classList'].contains('active')) {
			filtersRequestMethod.push(elementsRequestMethods[i].textContent.toLowerCase());
		}
	}
	
	var elementsResponseStatuses = (document.querySelectorAll('#dropdownItemResponseStatuses'));
	var len = elementsResponseStatuses.length;
	var filtersResponseStatuses = new Array();
	
	for (var i = 0; i < len; i++) {
		if (elementsResponseStatuses[i]['classList'].contains('active')) {
			filtersResponseStatuses.push(elementsResponseStatuses[i].textContent.toLowerCase());
		}
	}
	
	var elementsFormControlText = (document.querySelectorAll('.form-control'));
	var filtersFormControlText = new Array();
	
	for (var i = 0; i < elementsFormControlText.length; i++) {
		if (elementsFormControlText[i].disabled) {
			
		}
		filtersFormControlText.push(elementsFormControlText[i].value);
	}

	filters['request.method'] = filtersRequestMethod;
	filters['response.status'] = filtersResponseStatuses;
	
	obj.clearData();
	obj.filter(filters);
	obj.filterContainsText('request.url', filtersFormControlText);
	obj.showData();
}

function saveTextRequestToFile(event) {
	var data = event.parentNode.querySelector('#block_request').firstChild.innerHTML;
	saveInFileWithUserDialog(data);
}

function saveTextResponseToFile(event) {
	var data = event.parentNode.querySelector('#block_response').firstChild.innerHTML;
	saveInFileWithUserDialog(data);
}

async function saveInFileWithUserDialog(data) {
	//console.log('Данные для сохранения:\n' + data);
	try {
		const handle = await window.showSaveFilePicker(FILE_OPTIONS);
		const writable = await handle.createWritable();
		await writable.write(data, null, 2);
		await writable.close();
		showMessage("Файл сохранен", SUCCESS_MESSAGE);
	} catch(e) {
		showMessage("Ошибка сохранения файла", ERROR_MESSAGE);
	}
}

function showMessage(text, color) {
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

function createSnackbar() {
	return `<div id="snackbar"></div>`;
}

function createFilterBlock(obj) {
	document.querySelector('.filters').innerHTML = '';
	
	var result = document.createElement('div');
	
	var header = document.createElement('h4');
	header.className = "sansserif";
	header.textContent = 'Фильтры';
	result.append(header);
	
	result.append(createMultiselectListCheckboxes(obj.activeRequestMethods, "requestMethod", 'Тип запроса'));
	result.append(createMultiselectListCheckboxes(obj.activeResponseStatuses, "responseStatus", 'Код ответа'));
	
	var button = createCustomElement('button', 'Применить', [ {"name":"id", "value":"buttonConfirm"}]);
	result.append(button);
	
	document.querySelector('.filters').append(result);
}

function createBottomElementsForOffcanvas() {
	var li = createCustomElement('li', '', [ {"name":"class", "value":"nav-item"} ]);
	var button = createCustomElement('button', 'Confirm', [ {"name":"type", "value":"button"},
		{"name":"class", "value":"btn btn-primary btn-sm"},
		{"name":"id", "value":"buttonConfirm"} ]);
	li.append(button);
	
	document.querySelector('.navbar-nav').append(li);
}

function createList(values, id) {
	var result = document.createElement('select');
	result.setAttribute('id', id);

	for (var key in values) {
		var option = document.createElement('option');
		option.textContent = values[key];
		result.append(option);
	}
	
	return result;
}

function createMultiselectListCheckboxes(values, id, text) {
	var result = createCustomElement('div', '', [ {"name":"class", "value":"multiselect"} ]);
	
    var selectElem = createCustomElement('select');
	var optionElem = createCustomElement('option', text);
	selectElem.append(optionElem);
	var selectBoxElem = createCustomElement('div', '', [ {"name":"class", "value":"selectBox"} ]);
	selectBoxElem.addEventListener('click',
		function(e) {
			showCheckboxes(this);
			e.stopPropagation();
			},
		true);
	selectBoxElem.append(selectElem);
	var overSelect = createCustomElement('div', '', [ {"name":"class", "value":"overSelect"} ]);
	selectBoxElem.append(overSelect);
	result.append(selectBoxElem);
	
	var divCheckboxes = createCustomElement('div', '', [ {"name":"id", "value":"checkboxes"} ]);
	for (var key in values) {
		var idCheckbox = 'id' + id + values[key];
		var attributesCheckbox = [ {"name":"id", "value":idCheckbox}, {"name":"type", "value":"checkbox"} ]
		divCheckboxes.append(createCheckboxAndLabel(values[key], attributesCheckbox));
	}
	result.append(divCheckboxes);
	
	return result;
}

function createTextListFiltersBlock(id, placeholderText) {
	var result = createCustomElement('div', '', [ {"name":"class", "value":"mb-1 row"}, {"name":"id", "value":id} ]);
	
	var div = createCustomElement('div', '', [ {"name":"class", "value":"input-group mb-1"} ]);
	var buttonAddId = 'buttonAdd';
	var input = createCustomElement('input', '',
		[ {"name":"type", "value":"text"},
		{"name":"class", "value":"form-control form-control-sm"},
		{"name":"placeholder", "value":placeholderText},
		{"name":"aria-describedby", "value":buttonAddId} ]);
	div.append(input);
	var buttonAdd = createCustomElement('button', '+', [ {"name":"class", "value":"btn btn-outline-secondary btn-sm"},
		{"name":"type", "value":"button"},
		{"name":"id", "value":buttonAddId} ]);	
	div.append(buttonAdd);
	buttonAdd.addEventListener('click', function() {
		var elem = this.parentNode.querySelector('.form-control');
		var value = elem.value;
		if (value) {
			elem.value = '';
			addTextLine(value);
		}
	});
	input.addEventListener("keypress", function(event) {
	  if (event.key === "Enter") {
		var elem = this.parentNode.querySelector('.form-control');
		var value = elem.value;
		if (value) {
			elem.value = '';
			addTextLine(value);
		}
	  }
	});
	result.append(div);
	
	document.querySelector('.navbar-nav').append(result);
}

// Добавить строку с заблокированным текстовым полем и кнопкой
function createTextLine(elemToAdd, text, buttonText) {
	var div = createCustomElement('div', '', [ {"name":"class", "value":"input-group mb-1"} ]);
	var buttonAddId = 'buttonAddId';
	var input = createCustomElement('input', '',
		[ {"name":"type", "value":"text"},
		{"name":"class", "value":"form-control form-control-sm"},
		{"name":"value", "value":text},
		{"name":"aria-describedby", "value":buttonAddId},
		{"name":"disabled", "value":"disabled"}  ]);
	div.append(input);
	var button = createCustomElement('button', buttonText, [ {"name":"class", "value":"btn btn-outline-secondary btn-sm"},
		{"name":"type", "value":"button"},
		{"name":"id", "value":buttonAddId} ]);
	div.append(button);
	button.addEventListener('click', function() { deleteTextLine(button); });
	
	elemToAdd.append(div);
}

// Добавить линию с текстовым полем и кнопкой
function addTextLine(value) {
	createTextLine(document.querySelector('#urlTextFilter'), value, '×');
}

function deleteTextLine(target) {
	target.parentNode.remove();
}

var expanded = false;

function showCheckboxes(event) {
	log('showCheckboxes ' + expanded)
	var checkboxes = event.parentNode.querySelector('#checkboxes');
	if (!expanded) {
		checkboxes.style.display = "block";
		expanded = true;
	} else {
		checkboxes.style.display = "none";
		expanded = false;
	}
}

function createBlockCheckboxes(values, id) {
	var result = document.createElement('div');
	result.setAttribute('id', id);

	for (var key in values) {
		var id = 'idCheckbox' + values[key];
		var attributesCheckbox = [ {"name":"id", "value":id}, {"name":"type", "value":"checkbox"} ]
		result.append(createCheckboxAndLabel(values[key], attributesCheckbox));
	}

	return result;
}

function createCustomElement(type, textContent, attributes) {
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

function createCheckboxAndLabel(labelText, attributesCheckbox) {
	//var result = createCustomElement('label', labelText, [ {"name":"for", "value":attributesCheckbox['id']} ]);
	var result = createCustomElement('label', labelText);
	var input = createCustomElement('input', '', attributesCheckbox);
	input.addEventListener('click',
		function(e) {
		log('>>> ' + e.target.checked)
		log('> ' + e.target.parentNode.textContent)
		log('> ' + e.target.parentNode.innerText)
		log('> ' + e.target.parentNode.value)
		log('> ' + e.target.parentNode.innerHTML)
			});
	result.append(input);
	
	return result;
}

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

// let opener = new Opener();
	
// Сервисные функции
//================================================================================================

function log(text) {
	console.log(getTimestamp() + ' [options.js] ' + text);
}

function getTimestamp() {
	var now = new Date();
	var date = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	return formatDateTime(date.toISOString());
}

function formatDateTime(value) {
	return value.replace('T', ' ').replace('Z', '');
}

function getObject(name, value) {
	log('=== Объект ' + name + ', тип данных: ' + typeof value);
	if (typeof value === 'string') {
		log(' - тип данных: string, значение: ' + value);
	} else {
		for (var key in value) {
			log(' > тип данных: ' + typeof value[key] + ', ключ: ' + key + ', значение: ' + value[key]);
		}
	}
	
	try {
		log(' - JSON.parse: ' + JSON.parse(value));
	} catch(e) {}
	
	try {
		log(' - JSON.stringify: ' + JSON.stringify(value));
	} catch(e) {}
	
	log('===');
}