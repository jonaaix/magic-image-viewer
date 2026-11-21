const KEY_EVENTS = ['keydown', 'keyup', 'keypress'];

function copyOf(event) {
    return new KeyboardEvent(event.type, {
        key: event.key,
        code: event.code,
        location: event.location,
        repeat: event.repeat,
        isComposing: event.isComposing,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        bubbles: true,
        cancelable: true,
        composed: false,
    });
}

export function guardKeys(viewer) {
    function stop(event) {
        if (viewer.isOpen()) {
            event.stopPropagation();
        }
    }

    function forwardInside(event) {
        if (!viewer.isOpen() || !viewer.owns(event) || event.defaultPrevented) {
            return;
        }

        if (!event.composedPath()[0].dispatchEvent(copyOf(event))) {
            event.preventDefault();
        }
    }

    for (const type of KEY_EVENTS) {
        window.addEventListener(type, stop, true);
    }

    return {
        forwardAfterViewer() {
            for (const type of KEY_EVENTS) {
                window.removeEventListener(type, forwardInside, true);
                window.addEventListener(type, forwardInside, true);
            }
        },
    };
}
