chrome.runtime.onMessage.addListener(handleMessages);

// This function performs basic filtering and error checking on messages before
// dispatching the message to a more specific message handler.
async function handleMessages(message) {
	// Return early if this message isn't meant for the offscreen document.
	if (message.target !== 'offscreen') {
		return false;
	}

	// Dispatch the message to an appropriate handler.
	switch (message.type) {
		case 'get-full-local-storage':
			sendToBackground('get-full-local-storage-result', loadDataCache());
			break;
		case 'get-local-storage':
			sendToBackground('local-storage-result', loadObjectFromCache(message.data));
			break;
		default:
			console.warn(`Unexpected message type received: '${message.type}'.`);
			return false;
	}
}

function loadDataCache() {
	if (typeof localStorage['dataCache'] === 'undefined') {
		localStorage['dataCache'] = JSON.stringify({});
	}
	let dataCache = JSON.parse(localStorage['dataCache']);
	return dataCache;
}

function loadObjectFromCache(objName) {
	var dataCache = loadDataCache();
	return dataCache[objName];
}

function sendToBackground(type, data) {
	chrome.runtime.sendMessage({
		type: type,
		target: 'background',
		data: data,
	});
}
