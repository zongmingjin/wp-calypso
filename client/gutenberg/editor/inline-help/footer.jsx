/** @format */

/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal Dependencies
 */
import Button from 'components/button';

const GutenbergInlineHelpFooter = ( { translate } ) => (
	<div>
		<p>foo bar</p>
		<Button>{ translate( 'Switch to the Classic Editor' ) }</Button>
	</div>
);

export default connect()( localize( GutenbergInlineHelpFooter ) );
