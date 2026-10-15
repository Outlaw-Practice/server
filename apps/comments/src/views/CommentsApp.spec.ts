/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CommentsApp from './CommentsApp.vue'

vi.mock('@nextcloud/auth', async (importOriginal) => ({
	...await importOriginal<object>(),
	getCurrentUser: () => ({ uid: 'alice', displayName: 'Alice' }),
}))

vi.mock('../services/GetComments.ts', () => ({
	DEFAULT_LIMIT: 20,
	// Never resolves, so the app stays in its loading state
	getComments: vi.fn(() => new Promise(() => {})),
}))

vi.mock('../services/ReadComments.ts', () => ({
	markCommentsAsRead: vi.fn(),
}))

/**
 * Mount the app without the comment editor, which is not under test
 */
function mountApp() {
	return mount(CommentsApp, {
		props: { resourceId: 1 },
		global: {
			stubs: { CommentEntry: true },
			directives: { elementVisibility: {} },
		},
	})
}

describe('CommentsApp.vue', () => {
	it('shows a spinner instead of the list while loading the first page', async () => {
		const wrapper = mountApp()
		expect(wrapper.find('.loading-icon').exists()).toBe(false)

		wrapper.vm.update(1)
		await nextTick()

		expect(wrapper.find('.comments__loading.loading-icon').exists()).toBe(true)
		expect(wrapper.find('.comments__info').exists()).toBe(false)
	})

	it('shows a spinner below the list while loading more comments', async () => {
		const wrapper = mountApp()

		await wrapper.setData({ loading: true, offset: 20 })

		expect(wrapper.find('.comments__info.loading-icon').exists()).toBe(true)
		expect(wrapper.find('.comments__loading').exists()).toBe(false)
	})
})
