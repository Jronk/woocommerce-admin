/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import { Fragment, useState } from '@wordpress/element';
import Gridicon from 'gridicons';
import PropTypes from 'prop-types';
import {
	IconButton,
	NavigableMenu,
	SelectControl,
} from '@wordpress/components';

/**
 * WooCommerce dependencies
 */
import {
	EllipsisMenu,
	MenuItem,
	MenuTitle,
	SectionHeader,
} from '@woocommerce/components';
import {
	useUserPreferences,
} from '@woocommerce/data';
import { getAllowedIntervalsForQuery } from 'lib/date';

/**
 * Internal dependencies
 */
import ChartBlock from './block';
import { uniqCharts } from './config';
import { recordEvent } from 'lib/tracks';
import './style.scss';

const DashboardCharts = ( props ) => {
	const {
		controls: Controls,
		hiddenBlocks,
		isFirst,
		isLast,
		onMove,
		onRemove,
		onTitleBlur,
		onTitleChange,
		onToggleHiddenBlock,
		path,
		title,
		titleInput,
	} = props;
	const { updateUserPreferences, ...userPrefs } = useUserPreferences();
	const [ chartType, setChartType ] = useState( userPrefs.dashboard_chart_type || 'line' );
	const [ chartInterval, setChartInterval ] = useState( userPrefs.dashboard_chart_interval || 'day' );
	const query = { ...props.query, chartType, chartInterval };

	const handleTypeToggle = ( type ) => {
		return () => {
			setChartType( type );
			const userDataFields = {
				dashboard_chart_type: type,
			};
			updateUserPreferences( userDataFields );
			recordEvent( 'dash_charts_type_toggle', { chart_type: type } );
		};
	};

	const renderMenu = () =>(
		<EllipsisMenu
			label={ __(
				'Choose which charts to display',
				'woocommerce-admin'
			) }
			renderContent={ ( { onToggle } ) => (
				<Fragment>
					<MenuTitle>
						{ __( 'Charts', 'woocommerce-admin' ) }
					</MenuTitle>
					{ uniqCharts.map( ( chart ) => {
						const key = chart.endpoint + '_' + chart.key;
						const checked = ! hiddenBlocks.includes( key );
						return (
							<MenuItem
								checked={ checked }
								isCheckbox
								isClickable
								key={ chart.endpoint + '_' + chart.key }
								onInvoke={ () => {
									onToggleHiddenBlock( key )();
									recordEvent(
										'dash_charts_chart_toggle',
										{
											status: checked ? 'off' : 'on',
											key,
										}
									);
								} }
							>
								{ chart.label }
							</MenuItem>
						);
					} ) }
					{ window.wcAdminFeatures[
						'analytics-dashboard/customizable'
					] && (
						<Controls
							onToggle={ onToggle }
							onMove={ onMove }
							onRemove={ onRemove }
							isFirst={ isFirst }
							isLast={ isLast }
							onTitleBlur={ onTitleBlur }
							onTitleChange={ onTitleChange }
							titleInput={ titleInput }
						/>
					) }
				</Fragment>
			) }
		/>
	);

	const setInterval = ( interval ) => {
		setChartInterval( interval );
		const userDataFields = {
			dashboard_chart_interval: interval,
		};
		updateUserPreferences( userDataFields );
		recordEvent( 'dash_charts_interval', { interval } );
	};

	const renderIntervalSelector = () => {
		const allowedIntervals = getAllowedIntervalsForQuery(
			props.query
		);
		if ( ! allowedIntervals || allowedIntervals.length < 1 ) {
			return null;
		}

		const intervalLabels = {
			hour: __( 'By hour', 'woocommerce-admin' ),
			day: __( 'By day', 'woocommerce-admin' ),
			week: __( 'By week', 'woocommerce-admin' ),
			month: __( 'By month', 'woocommerce-admin' ),
			quarter: __( 'By quarter', 'woocommerce-admin' ),
			year: __( 'By year', 'woocommerce-admin' ),
		};

		return (
			<SelectControl
				className="woocommerce-chart__interval-select"
				value={ chartInterval }
				options={ allowedIntervals.map( ( allowedInterval ) => ( {
					value: allowedInterval,
					label: intervalLabels[ allowedInterval ],
				} ) ) }
				onChange={ setInterval }
			/>
		);
	}

	const renderChartBlocks = () => {
		// Reduce the API response to only the necessary stat fields
		// by supplying all charts common to each endpoint.
		const chartsByEndpoint = uniqCharts.reduce( ( byEndpoint, chart ) => {
			if ( typeof byEndpoint[ chart.endpoint ] === 'undefined' ) {
				byEndpoint[ chart.endpoint ] = [];
			}
			byEndpoint[ chart.endpoint ].push( chart );

			return byEndpoint;
		}, {} );

		return (
			<div className="woocommerce-dashboard__columns">
				{ uniqCharts.map( ( chart ) => {
					return hiddenBlocks.includes(
						chart.endpoint + '_' + chart.key
					) ? null : (
						<ChartBlock
							charts={ chartsByEndpoint[ chart.endpoint ] }
							endpoint={ chart.endpoint }
							key={ chart.endpoint + '_' + chart.key }
							path={ path }
							query={ query }
							selectedChart={ chart }
						/>
					);
				} ) }
			</div>
		);
	}

	return (
		<Fragment>
			<div className="woocommerce-dashboard__dashboard-charts">
				<SectionHeader
					title={ title || __( 'Charts', 'woocommerce-admin' ) }
					menu={ renderMenu() }
					className={ 'has-interval-select' }
				>
					{ renderIntervalSelector() }
					<NavigableMenu
						className="woocommerce-chart__types"
						orientation="horizontal"
						role="menubar"
					>
						<IconButton
							className={ classNames(
								'woocommerce-chart__type-button',
								{
									'woocommerce-chart__type-button-selected':
										! query.chartType ||
										query.chartType === 'line',
								}
							) }
							icon={ <Gridicon icon="line-graph" /> }
							title={ __(
								'Line chart',
								'woocommerce-admin'
							) }
							aria-checked={ query.chartType === 'line' }
							role="menuitemradio"
							tabIndex={ query.chartType === 'line' ? 0 : -1 }
							onClick={ handleTypeToggle( 'line' ) }
						/>
						<IconButton
							className={ classNames(
								'woocommerce-chart__type-button',
								{
									'woocommerce-chart__type-button-selected':
										query.chartType === 'bar',
								}
							) }
							icon={ <Gridicon icon="stats-alt" /> }
							title={ __( 'Bar chart', 'woocommerce-admin' ) }
							aria-checked={ query.chartType === 'bar' }
							role="menuitemradio"
							tabIndex={ query.chartType === 'bar' ? 0 : -1 }
							onClick={ handleTypeToggle( 'bar' ) }
						/>
					</NavigableMenu>
				</SectionHeader>
				{ renderChartBlocks( query ) }
			</div>
		</Fragment>
	);
};

DashboardCharts.propTypes = {
	path: PropTypes.string.isRequired,
	query: PropTypes.object.isRequired,
};

export default DashboardCharts;
