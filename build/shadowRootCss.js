const ROOT_FONT_SIZE = 16;
const REM = /(-?\d*\.?\d+)rem\b/g;

function toPixels(value) {
    return value.replace(REM, (match, amount) => `${parseFloat((Number(amount) * ROOT_FONT_SIZE).toFixed(4))}px`);
}

function propertyDefaults(root, postcss) {
    const defaults = [];

    root.walkAtRules('property', (rule) => {
        let initial = null;

        rule.walkDecls('initial-value', (decl) => {
            initial = decl.value;
        });

        if (initial !== null) {
            defaults.push(postcss.decl({ prop: rule.params.trim(), value: initial }));
        }

        rule.remove();
    });

    if (defaults.length) {
        root.prepend(postcss.rule({ selector: ':host, *, ::before, ::after, ::backdrop', nodes: defaults }));
    }
}

export function shadowRootCss() {
    return {
        postcssPlugin: 'magic-image-viewer:shadow-root-css',
        Once(root, { postcss }) {
            propertyDefaults(root, postcss);
            root.walkDecls((decl) => {
                if (decl.value.includes('rem')) {
                    decl.value = toPixels(decl.value);
                }
            });
            root.walkAtRules('media', (rule) => {
                if (rule.params.includes('rem')) {
                    rule.params = toPixels(rule.params);
                }
            });
        },
    };
}

shadowRootCss.postcss = true;
