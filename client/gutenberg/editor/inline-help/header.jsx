/** @format */

/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';

/**
 * Internal Dependencies
 */
import Button from 'components/button';

const GutenbergInlineHelpHeader = ( { translate } ) => (
	<div className="inline-help__tour">
		<Button>{ translate( 'Load Demo' ) }</Button>
	</div>
);

export default connect()( localize( GutenbergInlineHelpHeader ) );
