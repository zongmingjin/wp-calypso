/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import AsyncLoad from 'components/async-load';
import TranslatorLauncher from 'layout/community-translator/launcher';
import InlineHelp from 'blocks/inline-help';
import config from 'config';
import hasActiveHappychatSession from 'state/happychat/selectors/has-active-happychat-session';
import HappychatButton from 'components/happychat/button';
import EnvironmentBadge from 'blocks/environment-badge';

const VerticalItem = ( { children } ) => (
	<div className="layout-floating-actions__item layout-floating-actions__item--vertical">
		{ children }
	</div>
);

const HorizontalItem = ( { children } ) => (
	<div className="layout-floating-actions__item layout-floating-actions__item--horizontal">
		{ children }
	</div>
);

const LayoutFloatingActions = ( { isHappychatButtonVisible, chatIsOpen = true } ) =>
	console.log( {
		enabled: config.isEnabled( 'happychat' ),
	} ) || (
		<div className="layout-floating-actions">
			<div className="layout-floating-actions__vertical-bar">
				<InlineHelp />
				<TranslatorLauncher />
				{ isHappychatButtonVisible &&
					config.isEnabled( 'happychat' ) && (
						<HappychatButton className="inline-help__happychat-button" allowMobileRedirect />
					) }
			</div>

			{ /*
			This doesn't work just yet, the intention is that these items
			can just slot in horizontally in much the same way the vertical items can.
		*/ }
			<HorizontalItem>
				<EnvironmentBadge />
				{ 'development' === process.env.NODE_ENV && (
					<AsyncLoad require="components/webpack-build-monitor" placeholder={ null } />
				) }
			</HorizontalItem>
		</div>
	);

LayoutFloatingActions.displayName = 'LayoutFloatingActions';

export default connect( state => ( {
	isHappychatButtonVisible: hasActiveHappychatSession( state ),
} ) )( LayoutFloatingActions );
