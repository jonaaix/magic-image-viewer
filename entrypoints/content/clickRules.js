import { isImageUrl } from './collector/rules.js';

export function linkKind(href, baseUri) {
    const value = href?.trim() ?? '';

    if (!value || value.startsWith('#') || /^javascript:/i.test(value)) {
        return 'none';
    }

    try {
        const url = new URL(value, baseUri);

        if (url.href.split('#')[0] === baseUri.split('#')[0] && url.hash) {
            return 'none';
        }

        return isImageUrl(url.href) ? 'image' : 'page';
    } catch {
        return 'none';
    }
}

export function shouldOpen({ link, altKey }) {
    return altKey || link !== 'page';
}

export const MAX_TAP_DISTANCE = 10;

export const CAROUSEL_MARKUP = [
    '.swiper', '.swiper-container', '.slick-slider', '.splide', '.glide', '.flickity-enabled', '[data-flickity]',
    '.owl-carousel', '.keen-slider', '.embla', '.carousel', '.f-carousel', '.tns-outer', '.glider',
].join(', ');

const SCROLLING_OVERFLOW = ['auto', 'scroll'];
const FREE_TOUCH_ACTIONS = ['auto', 'manipulation'];

export function isSwipeStyle({ overflowX, scrollsSideways, scrollSnapType, touchAction }) {
    return (SCROLLING_OVERFLOW.includes(overflowX) && scrollsSideways)
        || (!!scrollSnapType && scrollSnapType !== 'none')
        || (!!touchAction && !FREE_TOUCH_ACTIONS.includes(touchAction));
}

export function movedTooFar(from, to) {
    return !!from && !!to && Math.hypot(to.x - from.x, to.y - from.y) > MAX_TAP_DISTANCE;
}
