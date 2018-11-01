/** @format */

/**
 * Internal dependencies
 */

import './style.scss';
import component from './component.js';
import { settings } from './settings.js';
import FrontendManagement from 'gutenberg/extensions/shared/frontend-management.js';
import apiFetch from '@wordpress/api-fetch';

window.addEventListener( 'load', function() {
	// Do not initialize in editor.
	if ( window.wp.editor ) {
		return;
	}
	const frontendManagement = new FrontendManagement();

	/* !!!!! Temporary, to simulate API call without requiring Map block Jetpack branch */
	frontendManagement.blockIterator( document, [
		{
			component: component,
			options: {
				settings,
				props: { api_key: 'AIzaSyCOTuVJwfnD7SwHcXpN3ro-pqtI16YCTrc' },
			},
		},
	] );
	return;
	/* !!!!!! End temporary fix */

	const url = '/wp-json/jetpack/v4/service-api-keys/googlemaps';
	apiFetch( { url, method: 'GET' } ).then( result => {
		frontendManagement.blockIterator( document, [
			{
				component: component,
				options: {
					settings,
					props: { api_key: result.service_api_key },
				},
			},
		] );
	} );
} );
