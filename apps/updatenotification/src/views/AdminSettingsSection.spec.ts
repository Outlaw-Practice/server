/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminSettingsSection from './AdminSettingsSection.vue'

const state = vi.hoisted(() => {
	// AdminSettingsSection.vue reads window.OC.theme.productName on import
	(window as unknown as { OC: { theme: { productName: string } } }).OC.theme = { productName: 'Nextcloud' }
	return { data: {} as Record<string, unknown> }
})

vi.mock('@nextcloud/initial-state', () => ({
	loadState: () => state.data,
}))

// The debounced group search is shared by every instance, which `debounce` refuses
vi.mock('debounce', () => ({
	default: <T>(fn: T) => fn,
}))

vi.mock('@nextcloud/axios', () => ({
	// Never resolves, so the app list stays unfetched
	default: { get: vi.fn(() => new Promise(() => {})) },
}))

/**
 * @param data - Initial state overrides
 */
function mountSection(data: Record<string, unknown>) {
	state.data = {
		isUpdateChecked: true,
		isNewVersionAvailable: false,
		channels: [],
		currentChannel: 'stable',
		isDefaultUpdateServerURL: true,
		...data,
	}
	return mount(AdminSettingsSection)
}

describe('AdminSettingsSection.vue', () => {
	beforeEach(() => {
		state.data = {}
	})

	it('shows a spinner while the app list is fetched', () => {
		const wrapper = mountSection({ isNewVersionAvailable: true })

		expect(wrapper.find('.loading-icon').exists()).toBe(true)
	})

	it('switches the toggle icon of the app lists', async () => {
		const wrapper = mountSection({ isNewVersionAvailable: true })
		await wrapper.setData({ missingAppUpdates: [{ appId: 'foo', appName: 'Foo' }] })

		const heading = wrapper.find('h3.clickable')
		expect(heading.find('.menu-up-icon').exists()).toBe(true)
		expect(heading.find('.menu-down-icon').exists()).toBe(false)

		await heading.trigger('click')

		expect(heading.find('.menu-up-icon').exists()).toBe(false)
		expect(heading.find('.menu-down-icon').exists()).toBe(true)
	})

	it('shows an info icon on the changelog link when up to date', () => {
		const wrapper = mountSection({})

		const link = wrapper.find('a.details')
		expect(link.attributes('href')).toBe('https://nextcloud.com/changelog/')
		expect(link.find('.information-outline-icon').exists()).toBe(true)
	})
})
