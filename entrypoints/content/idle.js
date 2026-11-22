export const IDLE_TIMEOUT_MS = 2000;

export function prepareWhenIdle(callback) {
    const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS }) : setTimeout(callback, 50));

    if (document.readyState === 'complete') {
        idle();
    } else {
        window.addEventListener('load', idle, { once: true });
    }
}
