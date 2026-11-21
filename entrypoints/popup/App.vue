<script setup>
import { computed, onMounted, ref } from 'vue';
import { Alert, Button, Switch } from '@aaix/laravel-islands/vue/helpers';
import { enabledSetting, readSettings, setSiteEnabled, siteOf } from '../../utils/settings.js';
import { isReachable } from '../../utils/reachablePages.js';
import ArrowTopRightOnSquareIcon from './icons/ArrowTopRightOnSquareIcon.vue';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon.vue';
import InformationCircleIcon from './icons/InformationCircleIcon.vue';

const REPOSITORY_URL = 'https://github.com/jonaaix/magic-image-viewer';
const ALL_SITES = { origins: ['<all_urls>'] };

const t = (key, ...substitutions) => browser.i18n.getMessage(key, substitutions);

const loaded = ref(false);
const enabled = ref(true);
const site = ref(null);
const siteEnabled = ref(true);
const hasAccess = ref(true);
const version = browser.runtime.getManifest().version;

const siteLabel = computed(() => (site.value === 'file://' ? t('popup_localFiles') : site.value));

async function currentTab() {
    const testUrl = import.meta.env.MODE === 'test' && new URLSearchParams(window.location.search).get('url');

    if (testUrl) {
        return { url: testUrl };
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    return tab;
}

async function toggleEnabled(value) {
    enabled.value = value;
    await enabledSetting.setValue(value);
}

async function toggleSite(value) {
    siteEnabled.value = value;
    await setSiteEnabled(site.value, value);
}

async function requestAccess() {
    hasAccess.value = await browser.permissions.request(ALL_SITES);
}

onMounted(async () => {
    const [tab, settings, access] = await Promise.all([currentTab(), readSettings(), browser.permissions.contains(ALL_SITES)]);

    site.value = isReachable(tab?.url) ? siteOf(tab.url) : null;
    enabled.value = settings.enabled;
    siteEnabled.value = !settings.disabledSites.includes(site.value);
    hasAccess.value = access;
    loaded.value = true;
});
</script>

<template>
    <main class="w-80">
        <header class="flex h-12 items-center border-b border-gray-200 px-4 dark:border-white/10">
            <h1 class="text-sm font-semibold">Magic Image Viewer</h1>
        </header>

        <section class="min-h-[6.5rem] space-y-1 p-2">
            <template v-if="loaded">
                <label class="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/5">
                    <span class="font-medium">{{ t('popup_allSites') }}</span>
                    <Switch :model-value="enabled" data-setting="enabled" @update:model-value="toggleEnabled" />
                </label>

                <label
                    v-if="site"
                    class="flex items-center justify-between gap-3 rounded-lg px-2 py-2"
                    :class="enabled ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : 'cursor-not-allowed'"
                >
                    <span class="min-w-0">
                        <span class="block break-all font-medium" :class="enabled ? '' : 'text-gray-400 dark:text-gray-500'">{{ siteLabel }}</span>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t('popup_thisSite') }}</span>
                    </span>
                    <Switch :model-value="enabled && siteEnabled" :disabled="!enabled" data-setting="site" @update:model-value="toggleSite" />
                </label>

                <p v-else class="flex items-center gap-2 px-2 py-2 text-gray-500 dark:text-gray-400" data-hint="unreachable">
                    <InformationCircleIcon class="h-5 w-5 shrink-0" />
                    {{ t('popup_unavailable') }}
                </p>
            </template>
        </section>

        <div v-if="loaded && !hasAccess" class="px-4 pb-4">
            <Alert tone="warning" :title="t('popup_accessTitle')" :description="t('popup_accessText')">
                <template #icon><ExclamationTriangleIcon class="h-4 w-4" /></template>
                <template #actions>
                    <Button tone="cta" :label="t('popup_allowAccess')" @click="requestAccess" />
                </template>
            </Alert>
        </div>

        <footer class="flex h-11 items-center justify-between border-t border-gray-200 px-4 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
            <span class="tabular-nums">{{ t('popup_version', version) }}</span>
            <a :href="REPOSITORY_URL" target="_blank" rel="noopener" class="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
                {{ t('popup_sourceCode') }}
                <ArrowTopRightOnSquareIcon class="h-3.5 w-3.5" />
            </a>
        </footer>
    </main>
</template>
