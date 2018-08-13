/** @format */

/**
 * External dependencies
 */

import { filter, map, noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import ControlItem from 'components/segmented-control/item';

export default class SegmentedControl extends React.Component {
	static propTypes = {
		initialSelected: PropTypes.string,
		compact: PropTypes.bool,
		className: PropTypes.string,
		style: PropTypes.object,
		onSelect: PropTypes.func,
		options: PropTypes.arrayOf(
			PropTypes.shape( {
				value: PropTypes.string.isRequired,
				label: PropTypes.string.isRequired,
				path: PropTypes.string,
			} )
		),
	};

	static defaultProps = {
		compact: false,
	};

	items = [];

	constructor( props ) {
		super( props );

		let selected;
		if ( props.options ) {
			selected = props.initialSelected || props.options[ 0 ].value;
		}

		this.state = { selected, keyboardNavigation: false };
	}

	render() {
		const segmentedClasses = {
			'segmented-control': true,
			'keyboard-navigation': this.state.keyboardNavigation,
			'is-compact': this.props.compact,
			'is-primary': this.props.primary,
		};

		return (
			<ul
				className={ classNames( segmentedClasses, this.props.className ) }
				style={ this.props.style }
				role="radiogroup"
				onKeyDown={ this.navigateItem }
				onKeyUp={ this.getKeyboardNavigationHandler( true ) }
			>
				{ this.getSegmentedItems() }
			</ul>
		);
	}

	createChildRef = ( child, index ) => {
		return ref => ( child.type === ControlItem ? ( this.items[ index ] = ref ) : null );
	};

	getSegmentedItems = () => {
		if ( this.props.children ) {
			let refIndex = 0;
			// add keys and refs to children
			return React.Children.map(
				this.props.children,
				function( child, index ) {
					const newChild = React.cloneElement( child, {
						ref: this.createChildRef( child, refIndex ),
						key: index,
						onClick: this.getKeyboardNavigationHandler(
							false,
							event => typeof child.props.onClick === 'function' && child.props.onClick( event )
						),
					} );

					if ( child.type === ControlItem ) {
						refIndex += 1;
					}

					return newChild;
				}.bind( this )
			);
		}

		return this.props.options.map( ( item, index ) => {
			return (
				<ControlItem
					key={ 'segmented-control-' + this.id + '-' + item.value }
					ref={ ref => ( this.items[ index ] = ref ) }
					selected={ this.state.selected === item.value }
					onClick={ this.selectItem.bind( this, item ) }
					path={ item.path }
					index={ index }
					value={ item.value }
				>
					{ item.label }
				</ControlItem>
			);
		} );
	};

	selectItem = option => {
		if ( ! option ) {
			return;
		}

		this.setState(
			{ selected: option.value, keyboardNavigation: false },
			() => this.props.onSelect && this.props.onSelect( option )
		);
	};

	getKeyboardNavigationHandler( keyboardNavigation, callback = noop ) {
		return event => this.setState( { keyboardNavigation }, callback( event ) );
	}

	navigateItem = event => {
		switch ( event.keyCode ) {
			case 9: // tab
				this.navigateItemByTabKey( event );
				break;
			case 32: // space
			case 13: // enter
				event.preventDefault();
				document.activeElement.click();
				break;
			case 37: // left arrow
				event.preventDefault();
				this.focusSibling( 'previous' );
				break;
			case 39: // right arrow
				event.preventDefault();
				this.focusSibling( 'next' );
				break;
		}
	};

	navigateItemByTabKey = event => {
		const direction = event.shiftKey ? 'previous' : 'next',
			newIndex = this.focusSibling( direction );

		// allow tabbing out of control
		if ( newIndex !== false ) {
			event.preventDefault();
		}
	};

	/**
	 * Allows for keyboard navigation
	 * @param  {String} direction - `next` or `previous`
	 * @return {Number|Boolean} - returns false if the newIndex is out of bounds
	 */
	focusSibling = direction => {
		const items = this.props.options
			? filter( map( this.props.options, 'value' ), Boolean )
			: filter( this.props.children, item => item.type === ControlItem );

		if ( typeof this.focused !== 'number' ) {
			this.focused = this.getCurrentFocusedIndex();
		}

		const increment = direction === 'previous' ? -1 : 1;
		const newIndex = this.focused + increment;
		if ( newIndex >= items.length || newIndex < 0 ) {
			return false;
		}

		this.items[ newIndex ].focusItemLink();
		this.focused = newIndex;

		return newIndex;
	};

	getCurrentFocusedIndex = () => {
		// item is the <li> element containing the focused link
		const activeItem = document.activeElement.parentNode,
			siblings = Array.prototype.slice( activeItem.parentNode.children ),
			index = siblings.indexOf( activeItem );

		return index > -1 ? index : 0;
	};
}
