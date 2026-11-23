import { loadVariable } from './tools.js';
import { DEFAULT_OPEN_TRACKERS, DEFAULT_CLICK_TRACKERS, CLICK_HEURISTICS_CONFIG } from './tracker-data.js';

async function loadTrackerList(customVarName, defaultList, forceDefault, label) {
	let useCustomLists = await loadVariable('useCustomLists');
	if (!forceDefault && useCustomLists) {
		try {
			let customList = await loadVariable(customVarName);
			if (customList == '') {
				customList = '[]';
			}
			return JSON.parse(customList);
		} catch (error) {
			console.log(`${label} JSON does not exist or has some errors`);
		}
	}
	return defaultList;
}

export async function getOpenTrackerList(forceDefault = false) {
	return loadTrackerList('customOpenTrackers', DEFAULT_OPEN_TRACKERS, forceDefault, 'Open trackers');
}

export async function getClickTrackerList(forceDefault = false) {
	return loadTrackerList('customClickTrackers', DEFAULT_CLICK_TRACKERS, forceDefault, 'Click trackers');
}

export async function getClickHeuristicsConfig() {
	return CLICK_HEURISTICS_CONFIG;
}
