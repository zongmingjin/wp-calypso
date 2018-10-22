/** @format */

/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { QUERY_FIELDS } from 'state/stats/chart-tabs/utils';

/**
 * Returns the number of views for a given post, or `null`.
 *
 * @param   {Object}  state    Global state tree
 * @param   {Number}  siteId   Site ID
 * @param   {string}  period   Type of duration to include in the query (such as daily)
 * @returns {Array}            Array of count objects
 */
export function getCountRecords( state, siteId, period ) {
	return get( state, [ 'stats', 'chartTabs', 'counts', siteId, period ], [] );
}

/**
 * Returns the number of views for a given post, or `null`.
 *
 * @param   {Object}  state    Global state tree
 * @param   {Number}  siteId   Site ID
 * @param   {string}  period   Type of duration to include in the query (such as daily)
 * @returns {Array}          	 Array of stat types as strings
 */
export function getLoadingTabs( state, siteId, period ) {
	// console.log(
	// 	QUERY_FIELDS.map(
	// 		type =>
	// 			`${ type }-${ get( state, [
	// 				'stats',
	// 				'chart',
	// 				'isLoading',
	// 				siteId,
	// 				period,
	// 				type,
	// 			] ) }-${ get( state, [ 'stats', 'chartTabs', 'isLoading', siteId, period, type ], true ) }`
	// 	)
	// );
	return QUERY_FIELDS.filter( type =>
		get( state, [ 'stats', 'chartTabs', 'isLoading', siteId, period, type ] )
	);
}
