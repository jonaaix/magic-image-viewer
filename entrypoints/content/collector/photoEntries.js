export function photoEntries(photos, start, image) {
    const entries = photos.map(({ sources: [src, ...fallbacks], thumb, alt }, index) => ({
        element: index === start ? image : null,
        item: {
            src,
            fallbacks,
            thumb,
            preview: index === start && image.currentSrc !== src ? image.currentSrc : undefined,
            alt: alt ?? (index === start ? image.alt || undefined : undefined),
        },
    }));

    return { entries, start };
}
