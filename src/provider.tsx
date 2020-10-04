import React, {ReactNode} from 'react'
import {Context, ContextValue} from './context'

export interface ProviderProps {
	// TODO: Maybe allow overriding the entire fetch process so someone could use e.g. kobold?
	/** Base FFXIV API URL. Defaults to `https://xivapi.com` - any alternatives should match its schema. */
	baseUrl?: string
	/**
	 * Language to render tooltips in. Defaults to `en`. Accepts any values permitted on
	 * the `language` query parameter by the API specified by `baseUrl`.
	 */
	language?: string
	children?: ReactNode
}

export function Provider({
	baseUrl = 'https://xivapi.com',
	language = 'en',
	children,
}: ProviderProps) {
	// TODO: memo/cb/etc
	const value: ContextValue = {
		baseUrl,
		defaultLanguage: language,
		fetchGameData: ({sheet, columns: Columns, id, language}) => {
			// TODO: request batching
			const columns = Object.keys(Columns.columns ?? {}).join(',')
			return fetch(
				`${baseUrl}/${sheet}/${id}?columns=${columns}&language=${language}`,
			)
				.then(resp => resp.json())
				.then(data => {
					const sheet = new Columns()
					sheet.hydrate(data)
					return sheet
				})
		},
	}

	return <Context.Provider value={value}>{children}</Context.Provider>
}
