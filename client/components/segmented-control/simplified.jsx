/** @format */

/**
 * External dependencies
 */

import { filter } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import ControlItem from 'components/segmented-control/item';
import { handleKeyEvent, getCurrentFocusedIndex, getSiblingIndex } from './utilities';

export default class SegmentedControlSimplified extends React.Component {
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
		).isRequired,
	};
	static defaultProps = { compact: false };
	itemRefs = [];
	focused = null;
	state = {
		selected: this.props.initialSelected || this.props.options[ 0 ].value,
		keyboardNavigation: false,
	};

	/**
	 * Allows for keyboard navigation
	 * @param  {String} direction - `next` or `previous`
	 * @return {Number|Boolean} - returns false if the newIndex is out of bounds
	 */
	focusSibling = direction => {
		typeof this.focused !== 'number' && this.setCurrentFocusIndex();
		const items = filter( this.props.children, item => item.type === ControlItem );
		const newIndex = getSiblingIndex( items, direction );
		if ( newIndex ) {
			this.itemRefs[ newIndex ].focusItemLink();
			this.setCurrentFocusIndex( newIndex );
		}
		return newIndex;
	};

	setCurrentFocusIndex( index = getCurrentFocusedIndex() ) {
		this.focused = index;
	}

	renderOptions() {
		return this.props.options.map( ( option, index ) => (
			<ControlItem
				index={ index }
				key={ index }
				onClick={ () => {
					this.setState( { selected: option.value, keyboardNavigation: false } );
					this.props.onSelect && this.props.onSelect( option );
				} }
				path={ option.path }
				ref={ ref => ( this.itemRefs[ index ] = ref ) }
				selected={ this.state.selected === option.value }
				value={ option.value }
			>
				{ option.label }
			</ControlItem>
		) );
	}

	render() {
		const segmentedClasses = {
			'keyboard-navigation': this.state.keyboardNavigation,
			'is-compact': this.props.compact,
			'is-primary': this.props.primary,
		};

		return (
			<ul
				className={ classNames( 'segmented-control', segmentedClasses, this.props.className ) }
				style={ this.props.style }
				role="radiogroup"
				onKeyDown={ handleKeyEvent( this.focusSibling ) }
				onKeyUp={ () => this.setState( { keyboardNavigation: true } ) }
			>
				{ this.renderOptions() }
			</ul>
		);
	}
}
