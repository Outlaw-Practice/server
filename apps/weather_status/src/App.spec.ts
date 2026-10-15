/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import App from './App.vue'

vi.mock('./services/weatherStatusService.js', () => ({
	// Never resolves, the menu entries are rendered regardless
	getLocation: vi.fn(() => new Promise(() => {})),
	getFavorites: vi.fn(() => new Promise(() => {})),
}))

// weather-status.js provides the global t() and n() of the page
vi.stubGlobal('t', (_app: string, text: string) => text)
vi.stubGlobal('n', (_app: string, singular: string) => singular)

describe('App.vue', () => {
	it('shows a pencil icon on the custom address input', () => {
		const wrapper = mount(App, {
			global: {
				mixins: [{ methods: { t, n } }],
				// Render the menu entries without opening the menu
				stubs: { NcActions: { template: '<div><slot /></div>' } },
			},
		})

		const input = wrapper.findComponent({ name: 'NcActionInput' })
		expect(input.find('[aria-label="Pencil"] svg').exists()).toBe(true)
		expect(input.props('icon')).toBe('')
	})
})
