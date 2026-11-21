<script setup>
import { computed, onMounted, ref } from 'vue';
import { Alert, Button, IconButton, Switch } from '@aaix/laravel-islands/vue/helpers';
import { enabledSetting, readSettings, setSiteEnabled, siteOf } from '../../utils/settings.js';
import { isReachable } from '../../utils/reachablePages.js';
import { FILE_TAB, IMAGE_COUNT } from '../../utils/messages.js';
import { AUTHOR, COFFEE_URL, ISSUES_URL, PRIVACY_URL, REPOSITORY_URL } from '../../utils/links.js';
import BugAntIcon from './icons/BugAntIcon.vue';
import CodeBracketIcon from './icons/CodeBracketIcon.vue';
import ExclamationTriangleIcon from './icons/ExclamationTriangleIcon.vue';
import GiftIcon from './icons/GiftIcon.vue';
import PhotoIcon from './icons/PhotoIcon.vue';
import ShieldCheckIcon from './icons/ShieldCheckIcon.vue';
import StarIcon from './icons/StarIcon.vue';

const ALL_SITES = { origins: ['<all_urls>'] };

const t = (key, ...substitutions) => browser.i18n.getMessage(key, substitutions);
const formatNumber = new Intl.NumberFormat(browser.i18n.getUILanguage()).format;

const loaded = ref(false);
const enabled = ref(true);
const site = ref(null);
const siteEnabled = ref(true);
const hasAccess = ref(true);
const fileTab = ref(false);
const imageCount = ref(null);
const version = browser.runtime.getManifest().version;

const siteLabel = computed(() => (site.value === 'file://' ? t('popup_localFiles') : site.value));

const status = computed(() => {
    if (!site.value && !fileTab.value) {
        return 'unavailable';
    }

    if (!enabled.value) {
        return 'allOff';
    }

    return fileTab.value || siteEnabled.value ? 'active' : 'siteOff';
});

const statusText = computed(() => ({
    active: t('popup_statusActive'),
    siteOff: t('popup_statusSiteOff'),
    allOff: t('popup_statusAllOff'),
    unavailable: t('popup_unavailable'),
})[status.value]);

const imageCountText = computed(() => (imageCount.value === 1 ? t('popup_imagesOne') : t('popup_imagesOther', formatNumber(imageCount.value))));

const showsImageCount = computed(() => status.value === 'active' && !fileTab.value && imageCount.value !== null);

async function currentTab() {
    const testUrl = import.meta.env.MODE === 'test' && new URLSearchParams(window.location.search).get('url');

    if (testUrl) {
        const tabs = await browser.tabs.query({});

        // Without host access the page's tab hides its URL, so the one tab without a URL is the page under test.
        const pageTab = tabs.find((tab) => tab.url === testUrl) ?? tabs.find((tab) => !tab.url);

        return { ...pageTab, url: testUrl };
    }

    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

    return tab;
}

function ask(tab, type) {
    return tab?.id === undefined ? Promise.resolve(undefined) : browser.tabs.sendMessage(tab.id, { type }).catch(() => undefined);
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
    const [isFileTab, count] = await Promise.all([ask(tab, FILE_TAB), ask(tab, IMAGE_COUNT)]);

    fileTab.value = isFileTab === true;
    imageCount.value = Number.isInteger(count) ? count : null;
    site.value = isReachable(tab?.url) ? siteOf(tab.url) : null;
    enabled.value = settings.enabled;
    siteEnabled.value = !settings.disabledSites.includes(site.value);
    hasAccess.value = access;
    loaded.value = true;
});
</script>

<template>
    <main class="w-80">
        <header class="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-white/10">
            <img src="/icons/48.png" alt="" class="h-9 w-9" />
            <div class="min-w-0">
                <h1 class="text-sm font-semibold">Magic Image Viewer</h1>
                <p class="text-xs tabular-nums text-gray-500 dark:text-gray-400">{{ t('popup_version', version) }}</p>
            </div>
        </header>

        <div class="min-h-[11rem] space-y-3 p-3">
            <template v-if="loaded">
                <section
                    class="rounded-xl p-3 ring-1"
                    :class="status === 'active'
                        ? 'bg-emerald-50 text-emerald-900 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-400/20'
                        : 'bg-gray-50 text-gray-700 ring-gray-900/5 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10'"
                    :data-status="status"
                >
                    <p class="flex items-center gap-2 font-semibold">
                        <span class="h-2 w-2 shrink-0 rounded-full" :class="status === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-gray-400 dark:bg-gray-500'"></span>
                        <span :data-hint="status === 'unavailable' ? 'unreachable' : undefined">{{ statusText }}</span>
                    </p>
                    <p v-if="showsImageCount" class="mt-1 flex items-center gap-2 pl-4 text-xs text-emerald-800 dark:text-emerald-200" data-image-count>
                        <PhotoIcon class="h-4 w-4 shrink-0" />
                        <span class="tabular-nums">{{ imageCountText }}</span>
                    </p>
                </section>

                <section class="divide-y divide-gray-200 rounded-xl ring-1 ring-gray-900/5 dark:divide-white/10 dark:ring-white/10">
                    <label class="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5">
                        <span class="font-medium">{{ t('popup_allSites') }}</span>
                        <Switch :model-value="enabled" data-setting="enabled" @update:model-value="toggleEnabled" />
                    </label>

                    <label
                        v-if="site && !fileTab"
                        class="flex items-center justify-between gap-3 px-3 py-2.5"
                        :class="enabled ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5' : 'cursor-not-allowed'"
                    >
                        <span class="min-w-0">
                            <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t('popup_thisSite') }}</span>
                            <span class="block break-all font-semibold" :class="enabled ? '' : 'text-gray-400 dark:text-gray-500'">{{ siteLabel }}</span>
                        </span>
                        <Switch :model-value="enabled && siteEnabled" :disabled="!enabled" data-setting="site" @update:model-value="toggleSite" />
                    </label>
                </section>

                <Alert v-if="!hasAccess" tone="warning" :title="t('popup_accessTitle')" :description="t('popup_accessText')">
                    <template #icon><ExclamationTriangleIcon class="h-4 w-4" /></template>
                    <template #actions>
                        <Button tone="cta" :label="t('popup_allowAccess')" @click="requestAccess" />
                    </template>
                </Alert>

                <section class="grid grid-cols-2 gap-2">
                    <a
                        :href="PRIVACY_URL"
                        target="_blank"
                        rel="noopener"
                        class="rounded-xl p-3 ring-1 ring-gray-900/5 hover:bg-gray-50 dark:ring-white/10 dark:hover:bg-white/5"
                        data-trust="private"
                    >
                        <ShieldCheckIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span class="mt-2 block text-xs font-semibold">{{ t('popup_private') }}</span>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t('popup_privateText') }}</span>
                    </a>
                    <a
                        :href="REPOSITORY_URL"
                        target="_blank"
                        rel="noopener"
                        class="rounded-xl p-3 ring-1 ring-gray-900/5 hover:bg-gray-50 dark:ring-white/10 dark:hover:bg-white/5"
                        data-trust="free"
                    >
                        <GiftIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        <span class="mt-2 block text-xs font-semibold">{{ t('popup_free') }}</span>
                        <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t('popup_freeText') }}</span>
                    </a>
                </section>

                <a
                    v-if="COFFEE_URL"
                    :href="COFFEE_URL"
                    target="_blank"
                    rel="noopener"
                    class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFDD00] text-sm font-bold text-gray-900 transition-colors hover:bg-[#FFE53D] dark:bg-[#FFDD00] dark:text-gray-900 dark:hover:bg-[#FFE53D]"
                    data-link="coffee"
                >
                    <span aria-hidden="true" class="text-base">☕</span>
                    {{ t('popup_coffee') }}
                </a>
            </template>
        </div>

        <footer class="flex h-12 items-center justify-between gap-2 border-t border-gray-200 pl-4 pr-2 dark:border-white/10">
            <a :href="AUTHOR.url" target="_blank" rel="noopener" class="truncate text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" data-link="author">
                {{ t('popup_by', AUTHOR.name) }}
            </a>
            <nav class="flex items-center">
                <IconButton :href="REPOSITORY_URL" :label="t('popup_star')" size="sm" data-link="star"><StarIcon /></IconButton>
                <IconButton :href="ISSUES_URL" :label="t('popup_reportBug')" size="sm" data-link="issues"><BugAntIcon /></IconButton>
                <IconButton :href="REPOSITORY_URL" :label="t('popup_sourceCode')" size="sm" data-link="source"><CodeBracketIcon /></IconButton>
            </nav>
        </footer>
    </main>
</template>
