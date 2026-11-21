import { SITE_STATE } from '../../utils/messages.js';
import { readSettings, siteOf, watchSettings } from '../../utils/settings.js';

export function createActivation() {
    const site = siteOf(window.location.href);
    const listeners = [];
    let state = { enabled: false, siteEnabled: false };

    function apply({ enabled, disabledSites }) {
        state = { enabled, siteEnabled: enabled && !disabledSites.includes(site) };
        browser.runtime.sendMessage({ type: SITE_STATE, active: state.siteEnabled }).catch(() => {});
        listeners.forEach((listener) => listener(state));
    }

    const ready = readSettings().then(apply);
    watchSettings(apply);

    return {
        ready,
        isEnabled: () => state.enabled,
        isSiteEnabled: () => state.siteEnabled,
        onChange: (listener) => listeners.push(listener),
    };
}
