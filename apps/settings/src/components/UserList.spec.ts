/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Vue from 'vue'

const { state, dispatch } = vi.hoisted(() => ({
	state: { users: [] as { id: string, enabled: boolean }[], usersOffset: 0, disabledUsersOffset: 0 },
	dispatch: vi.fn(),
}))

vi.mock('@nextcloud/dialogs', () => ({ showError: vi.fn(), showWarning: vi.fn() }))
vi.mock('vue-router/composables', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('../store/index.js', () => ({
	useStore: () => ({
		dispatch,
		commit: vi.fn(),
		getters: {
			get getUsers() { return state.users },
			get getUsersOffset() { return state.usersOffset },
			getUsersLimit: 2,
			get getDisabledUsersOffset() { return state.disabledUsersOffset },
			getDisabledUsersLimit: 2,
			getSearchQuery: '',
			getShowConfig: {},
			getServerData: { canChangePassword: true, isAdmin: true, quotaPreset: [], languages: {} },
			getSortedGroups: [],
			getSubAdminGroups: [],
			getGroups: [],
		},
	}),
}))
vi.mock('./Users/VirtualList.vue', () => ({ default: { render: (h) => h('div') } }))

import UserList from './UserList.vue'
import { flushPromises } from './Users/dialogTestHelpers.ts'

// Vue 2 makes the object reactive in place, so the component's computeds track it
Vue.observable(state)

/**
 * Simulate the server returning the given pages of accounts in order.
 *
 * @param pages Pages of accounts, `true` meaning enabled
 */
function serverPages(pages: boolean[][]) {
	let page = 0
	dispatch.mockImplementation(async () => {
		const users = (pages[page] ?? []).map((enabled, i) => ({ id: `user-${page}-${i}`, enabled }))
		page++
		state.users = [...state.users, ...users]
		state.usersOffset += 2
		state.disabledUsersOffset += 2
		return users.length
	})
}

describe('UserList loading', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		state.users = []
		state.usersOffset = 0
		state.disabledUsersOffset = 0
	})

	it('keeps loading pages until a full page of enabled accounts is shown', async () => {
		serverPages([[false, false], [true, false], [false, false], [true, true]])
		mount(UserList)
		await flushPromises()

		expect(dispatch).toHaveBeenCalledTimes(4)
		expect(dispatch.mock.calls.map(([, { offset }]) => offset)).toEqual([0, 2, 4, 6])
	})

	it('stops loading once the server returns a partial page', async () => {
		serverPages([[false, false], [false]])
		mount(UserList)
		await flushPromises()

		expect(dispatch).toHaveBeenCalledTimes(2)
	})

	it('loads a single page when it only contains shown accounts', async () => {
		serverPages([[true, true], [true, true]])
		mount(UserList)
		await flushPromises()

		expect(dispatch).toHaveBeenCalledTimes(1)
	})

	it('loads a single page of disabled accounts in the disabled view', async () => {
		serverPages([[false, false], [false, false]])
		mount(UserList, { propsData: { selectedGroup: 'disabled' } })
		await flushPromises()

		expect(dispatch).toHaveBeenCalledTimes(1)
		expect(dispatch.mock.calls[0][0]).toBe('getDisabledUsers')
	})
})
