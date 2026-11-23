const IMAGE_TRIGGERS = '[role="button"]:not(button)';

function opensImage(control) {
    return control.matches(IMAGE_TRIGGERS) && !control.textContent.trim() && !!control.querySelector('img');
}

export function controlAround(element, selector) {
    for (let control = element.closest(selector); control; control = control.parentElement?.closest(selector) ?? null) {
        if (!opensImage(control)) {
            return control;
        }
    }

    return null;
}
