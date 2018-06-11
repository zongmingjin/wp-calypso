/** @format */

/**
 * External dependencies
 */
import React, { Component } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Dialog from 'components/dialog';
import FormSectionHeading from 'components/forms/form-section-heading';
import { closeDetailsDialog } from 'woocommerce/woocommerce-services/state/shipping-label/actions';
import {
	isLoaded,
	getShippingLabel,
} from 'woocommerce/woocommerce-services/state/shipping-label/selectors';
import WizardProgressBar from 'components/wizard-progress-bar';

class PackingStepsDialog extends Component {
	state = {
		currentStep: 0,
	};

	render() {
		const { orderId, siteId, isVisible, labelIndex, translate } = this.props;

		const box = { w: 10, l: 8, h: 5, name: 'Medium Box' };

		const steps = [
			{ w: 5, l: 4, h: 3, x: 0, y: 0, name: 'Product A' },
			{ w: 5, l: 4, h: 3, x: 5, y: 0, name: 'Product A' },
			{ w: 8, l: 4, h: 2, x: 0, y: 4, name: 'Product B' },
			{ w: 3, l: 7, h: 2, x: 0, y: 0, name: 'Product C' },
			{ w: 3, l: 7, h: 2, x: 3, y: 0, name: 'Product C' },
			{ w: 4, l: 8, h: 2, x: 6, y: 0, name: 'Product B' },
		];

		const width = 420;
		const scale = d => d / box.w * width;

		const renderItem = ( item, i ) => (
			<g
				transform={ `translate( ${ scale( item.x ) + 2 - scale( item.w ) / 4 }, ${ scale( item.y ) +
					2 -
					scale( item.h ) / 4 } )` }
			>
				<g
					transform={ `translate( ${ scale( item.w ) / 4 }, ${ scale( item.h ) / 4 } )` }
					className={ classNames( {
						'shipping-label__packing-steps-item': true,
						visible: i < this.state.currentStep,
						current: i === this.state.currentStep - 1,
					} ) }
				>
					<rect width={ scale( item.w ) - 2 } height={ scale( item.l ) - 2 } />
					<text textAnchor="middle" x={ scale( item.w ) / 2 } y={ scale( item.l ) } dy={ -6 }>{ `${
						item.w
					} in.` }</text>
					<text
						textAnchor="end"
						x={ scale( item.w ) }
						y={ scale( item.l ) / 2 - 2 }
						dx={ -6 }
						dy="0.35em"
					>{ `${ item.l } in.` }</text>
					<text dx={ 6 } dy={ 16 }>
						{ item.name }
					</text>
				</g>
			</g>
		);

		const onClose = () => this.props.closeDetailsDialog( orderId, siteId );
		const buttons = [
			<WizardProgressBar
				key="progress"
				currentStep={ this.state.currentStep }
				numberOfSteps={ steps.length }
				nextButtonClick={ () => {
					this.setState( { currentStep: this.state.currentStep + 1 } );
				} }
				previousButtonClick={ () => {
					this.setState( { currentStep: this.state.currentStep - 1 } );
				} }
			/>,
			{ action: 'close', label: translate( 'Close' ), onClick: onClose },
		];

		return (
			<Dialog
				additionalClassNames="packing-steps-modal woocommerce wcc-root"
				isVisible={ isVisible }
				onClose={ onClose }
				buttons={ buttons }
			>
				<FormSectionHeading className="shipping-label__label-details-modal-heading">
					<span className="shipping-label__label-details-modal-heading-title">
						{ translate( 'Label #%(labelIndex)s packing steps', {
							args: { labelIndex: labelIndex + 1 },
						} ) }
					</span>
				</FormSectionHeading>

				<svg
					className="shipping-label__packing-steps"
					width={ scale( box.w ) + 2 }
					height={ scale( box.l ) + 2 }
				>
					<g className="shipping-label__packing-steps-box">
						<rect width={ scale( box.w ) + 2 } height={ scale( box.l ) + 2 } />
						<text textAnchor="middle" x={ scale( box.w ) / 2 } y={ scale( box.l ) } dy={ 17 }>{ `${
							box.w
						} in.` }</text>
						<text
							textAnchor="start"
							x={ scale( box.w ) }
							y={ scale( box.l ) / 2 }
							dx={ 6 }
							dy="0.35em"
						>{ `${ box.l } in.` }</text>
						<text dy={ -6 }>{ box.name }</text>
					</g>
					{ steps.map( renderItem ) }
				</svg>
			</Dialog>
		);
	}
}

PackingStepsDialog.propTypes = {
	siteId: PropTypes.number.isRequired,
	orderId: PropTypes.number.isRequired,
	isVisible: PropTypes.bool,
	serviceName: PropTypes.string,
	packageName: PropTypes.string,
	productNames: PropTypes.array,
	closeDetailsDialog: PropTypes.func.isRequired,
	receiptId: PropTypes.number,
};

const mapStateToProps = ( state, { orderId, siteId, labelId } ) => {
	const loaded = isLoaded( state, orderId, siteId );
	const { detailsDialog } = getShippingLabel( state, orderId, siteId );
	return {
		isVisible: Boolean( loaded && detailsDialog && detailsDialog.labelId === labelId ),
	};
};

const mapDispatchToProps = dispatch => {
	return bindActionCreators( { closeDetailsDialog }, dispatch );
};

export default connect( mapStateToProps, mapDispatchToProps )( localize( PackingStepsDialog ) );
