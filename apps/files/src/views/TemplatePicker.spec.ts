/*
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import TemplatePicker from './TemplatePicker.vue'

describe('TemplatePicker.vue', () => {
	it('shows a spinner and a message while the file is created', async () => {
		const wrapper = mount(TemplatePicker, {
			global: {
				stubs: {
					NcModal: { template: '<div><slot /></div>' },
					TemplatePreview: true,
				},
			},
		})

		await wrapper.setData({
			opened: true,
			loading: true,
			name: 'Report.odt',
			provider: { mimetypes: ['application/vnd.oasis.opendocument.text'], templates: [] },
		})

		const overlay = wrapper.find('.templates-picker__loading')
		expect(overlay.find('.loading-icon').exists()).toBe(true)
		expect(overlay.text()).toContain('Creating file')
	})
})
