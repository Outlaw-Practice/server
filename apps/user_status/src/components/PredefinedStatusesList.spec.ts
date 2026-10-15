/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createStore } from 'vuex'
import PredefinedStatusesList from './PredefinedStatusesList.vue'

/**
 * @param loaded - Whether the predefined statuses have loaded
 */
function mountList(loaded: boolean) {
	const store = createStore({
		state: {
			predefinedStatuses: { predefinedStatuses: [] },
			userStatus: { messageId: null },
		},
		getters: {
			statusesHaveLoaded: () => loaded,
		},
	})
	return mount(PredefinedStatusesList, { global: { plugins: [store] } })
}

describe('PredefinedStatusesList.vue', () => {
	it('shows a spinner until the statuses have loaded', () => {
		expect(mountList(false).find('.loading-icon').exists()).toBe(true)
	})

	it('shows the list once the statuses have loaded', () => {
		const wrapper = mountList(true)

		expect(wrapper.find('.loading-icon').exists()).toBe(false)
		expect(wrapper.find('ul.predefined-statuses-list').exists()).toBe(true)
	})
})
