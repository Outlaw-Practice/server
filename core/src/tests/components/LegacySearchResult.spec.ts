/*!
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LegacySearchResult from '../../components/UnifiedSearch/LegacySearchResult.vue'

describe('LegacySearchResult.vue', () => {
	it('shows a spinner in place of the icon while loading', () => {
		const wrapper = mount(LegacySearchResult, { props: { title: 'Load more results', loading: true } })

		expect(wrapper.find('.unified-search__result-icon .loading-icon').exists()).toBe(true)
	})

	it('shows no spinner otherwise', () => {
		const wrapper = mount(LegacySearchResult, { props: { title: 'Load more results' } })

		expect(wrapper.find('.loading-icon').exists()).toBe(false)
	})
})
