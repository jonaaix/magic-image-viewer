export const MIN_SIZE_RATIO = 0.5;

const IGNORED_CHILDREN = new Set(['script', 'style', 'template', 'noscript', 'link', 'meta']);

const elementsOf = (node) => [...node.children].filter((child) => !IGNORED_CHILDREN.has(child.localName));

function imagesIn(node, counts) {
    if (node.localName === 'img') {
        return counts(node) ? [node] : [];
    }

    return elementsOf(node).flatMap((child) => imagesIn(child, counts));
}

function ratio(a, b) {
    return Math.min(a, b) / Math.max(a, b);
}

export function similarSize(a, b) {
    if (!a.width || !a.height || !b.width || !b.height) {
        return true;
    }

    return ratio(a.width, b.width) >= MIN_SIZE_RATIO || ratio(a.height, b.height) >= MIN_SIZE_RATIO;
}

export function shapeOf(node, counts, sameImage = () => false) {
    const images = imagesIn(node, counts);
    const image = images.at(-1);

    if (!image || !images.every((other) => other === image || sameImage(other, image))) {
        return null;
    }

    const names = [];

    for (let current = image; current !== node; current = current.parentElement) {
        names.unshift(current.localName);
    }

    return { key: [node.localName, ...names].join('>'), image };
}

function matcher({ counts, sizeOf, sameImage }, shape) {
    const size = sizeOf(shape.image);

    return (node) => {
        const candidate = shapeOf(node, counts, sameImage);

        return !!candidate && candidate.key === shape.key && similarSize(sizeOf(candidate.image), size);
    };
}

function purity(matches) {
    const isPure = (node) => {
        const children = elementsOf(node);

        return children.length > 0 && children.every((child) => matches(child) || isPure(child));
    };

    return isPure;
}

function itemsIn(node, matches) {
    return elementsOf(node).flatMap((child) => (matches(child) ? [child] : itemsIn(child, matches)));
}

function widen(parent, items, matches) {
    const isPure = purity(matches);

    if (!isPure(parent)) {
        return items;
    }

    let top = parent;

    for (let outer = top.parentElement; outer; outer = outer.parentElement) {
        const siblings = elementsOf(outer);

        if (!siblings.every(isPure)) {
            break;
        }

        top = outer;
    }

    return itemsIn(top, matches);
}

/**
 * Walks up from the image. On each level the branch holding the image is compared with its
 * siblings: same element, same path down to exactly one image (copies of the same picture, such
 * as a blurred backdrop, count as one), similar rendered size. The innermost level with such a
 * sibling is the group; it grows upwards only through wrappers that hold nothing but these items,
 * such as the rows or columns of a grid.
 */
export function findGroup(image, measures) {
    const counts = (node) => node === image || measures.counts(node);
    const options = { ...measures, counts };

    for (let branch = image, parent = image.parentElement; parent; branch = parent, parent = parent.parentElement) {
        const shape = shapeOf(branch, counts, measures.sameImage);

        if (!shape) {
            return null;
        }

        const matches = matcher(options, shape);
        const items = elementsOf(parent).filter((child) => child === branch || matches(child));

        if (items.length > 1) {
            return widen(parent, items, matches).map((item) => (item.contains(image) ? image : shapeOf(item, counts, measures.sameImage).image));
        }
    }

    return null;
}
