import { amazon } from './amazon.js';

const ADAPTERS = [amazon];

export function adaptedGallery(image) {
    for (const adapter of ADAPTERS) {
        const gallery = adapter.matches(location.hostname) ? adapter.gallery(image) : null;

        if (gallery) {
            return gallery;
        }
    }

    return null;
}
