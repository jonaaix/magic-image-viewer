import { DEFAULT_LABELS } from '@aaix/laravel-islands-gallery/vue';

export function lightboxLabels() {
    return Object.fromEntries(Object.keys(DEFAULT_LABELS).map((key) => [key, browser.i18n.getMessage(`lightbox_${key}`) || DEFAULT_LABELS[key]]));
}
