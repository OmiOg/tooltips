import axios from 'axios'
import {debounce, get, set, mapValues} from 'lodash-es'
import PropTypes from 'prop-types'
import React from 'react'

import {Provider as ReactProvider} from './Context'
import {getHandler} from './handlers'

const DEFAULT_BASE_URL = 'https://xivapi.com/'
const DEFAULT_DEBOUNCE_DELAY = 50

export default class Provider extends React.Component {
	static propTypes = {
		children: PropTypes.node,
		baseUrl: PropTypes.string,
		debounceDelay: PropTypes.number,
		language: PropTypes.string,
	}

	static defaultProps = {
		language: 'en',
	}

	// I like axios. Fight me.
	endpoint = null

	// Request queue handling
	run = null
	pending = {}

	constructor(...args) {
		super(...args)

		// Set up the state, it will be passed out to consumers
		this.state = {
			data: {},
			load: this.load.bind(this),
		}

		// Set up our endpoint with axios.
		this.endpoint = axios.create({
			baseURL: this.props.baseUrl || DEFAULT_BASE_URL,
		})

		// Set up the debounced processing func
		this.run = debounce(
			this._process.bind(this),
			this.props.debounceDelay || DEFAULT_DEBOUNCE_DELAY
		)
	}

	load(type, id) {
		const path = [this.props.language, type]
		const typePending = get(this.pending, path, [])
		typePending.push(id)
		set(this.pending, path, typePending)
		this.run()
	}

	_process() {
		const {language} = this.props

		const pending = this.pending
		this.pending = {}

		// We need to do a seperate request for each content type
		// For simplicity's sake, only request for the current lang
		Object.entries(pending[language]).forEach(([type, ids]) => {
			// Grab the handler for this type
			const handler = getHandler(type)

			// Run the data request
			// TODO: Pagination?
			this.endpoint.get(type, {
				params: {
					ids: ids.join(','),
					columns: Object.values(handler.columns).join(','),
					language,
				},
			}).then(response => {
				// TODO: Sanity check the response?
				const results = response.data.Results

				// Transform the response data into our representation and key by id
				const keyedResults = results.reduce((carry, content) => {
					const mapped = mapValues(handler.columns, value => get(content, value, null))
					carry[mapped.id] = mapped
					return carry
				}, {})

				// Set the new results in place
				this.setState(state => {
					const newState = {...state}
					set(newState, ['data', language, type], keyedResults)
					return newState
				})
			})
		})
	}

	render() {
		return <ReactProvider value={{
			...this.state,
			data: this.state.data[this.props.language],
			baseUrl: this.props.baseUrl || DEFAULT_BASE_URL,
		}}>
			{this.props.children}
		</ReactProvider>
	}
}
