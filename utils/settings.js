import { storage } from 'wxt/utils/storage';

export const enabledSetting = storage.defineItem('local:enabled', { fallback: true });
export const disabledSitesSetting = storage.defineItem('local:disabledSites', { fallback: [] });

export function siteOf(url) {
    const { protocol, hostname } = new URL(url);

    return protocol === 'file:' ? 'file://' : hostname;
}

export async function readSettings() {
    const [enabled, disabledSites] = await Promise.all([enabledSetting.getValue(), disabledSitesSetting.getValue()]);

    return { enabled, disabledSites };
}

export function watchSettings(callback) {
    const reread = async () => callback(await readSettings());
    enabledSetting.watch(reread);
    disabledSitesSetting.watch(reread);
}

export async function setSiteEnabled(site, enabled) {
    const sites = (await disabledSitesSetting.getValue()).filter((entry) => entry !== site);
    await disabledSitesSetting.setValue(enabled ? sites : [...sites, site]);
}
