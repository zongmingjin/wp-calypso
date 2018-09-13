/** @format */
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import CompactCard from 'components/card/compact';
import { getName, purchaseType } from 'lib/purchases';
import PurchaseIcon from '../purchases/purchase-icon';
import { managePending } from '../purchases/paths';

class PendingListItem extends Component {
	render() {
		const { purchase } = this.props;

		const onClick = () => window.scrollTo( 0, 0 );
		const href = managePending( purchase.orderId );

		return (
			<CompactCard className={ 'pending-purchases__list-item' } href={ href } onClick={ onClick }>
				<span className="pending-purchases__list-item-wrapper">
					<PurchaseIcon purchase={ purchase } />
					<div className="pending-purchases__list-item-details">
						<div className="pending-purchases__list-item-title">{ purchase.productName }</div>
						<div className="pending-purchases__list-item-purchase-type">
							{ purchase.paymentType }
						</div>
						<div className="pending-purchases__list-item-purchase-date">
							{ purchase.totalCostDisplay }
						</div>
					</div>
				</span>
			</CompactCard>
		);
	}
}

PendingListItem.propTypes = {
	isPlaceholder: PropTypes.bool,
	purchase: PropTypes.object,
};

export default localize( PendingListItem );
