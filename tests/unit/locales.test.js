import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const root = new URL('../../public/_locales/', import.meta.url);
const read = (locale) => JSON.parse(readFileSync(new URL(`${locale}/messages.json`, root), 'utf8'));
const english = read('en');
const locales = readdirSync(root).filter((name) => name !== 'en');

describe('locales', () => {
    test('every language agreed for the extension is present', () => {
        assert.deepEqual(locales.sort(), ['de', 'es', 'fr', 'it', 'nl', 'pl', 'pt_BR', 'pt_PT']);
    });

    for (const locale of locales) {
        test(`${locale} has every English key, none empty, no extra`, () => {
            const messages = read(locale);

            assert.deepEqual(Object.keys(messages).sort(), Object.keys(english).sort());

            for (const [key, { message }] of Object.entries(messages)) {
                assert.ok(message?.trim(), `${locale}.${key} is empty`);
            }
        });

        test(`${locale} keeps the placeholders of the English text`, () => {
            const messages = read(locale);

            for (const [key, { message }] of Object.entries(english)) {
                for (const placeholder of message.match(/:[a-z]+|\$[A-Z]+\$/g) ?? []) {
                    assert.ok(messages[key].message.includes(placeholder), `${locale}.${key} lacks ${placeholder}`);
                }
            }
        });
    }

    test('the store description fits the 132 character limit', () => {
        for (const locale of ['en', ...locales]) {
            assert.ok(read(locale).extDescription.message.length <= 132, locale);
        }
    });
});
