export async function log(text) {
	console.log(getTimestamp() + ' [options.js] ' + text);
}

export async function getObject(name, value) {
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

function getTimestamp() {
	var now = new Date();
	var date = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	return formatDateTime(date.toISOString());
}

function formatDateTime(value) {
	return value.replace('T', ' ').replace('Z', '');
}