import type { Language } from '../types/common';
import type { FieldNameTranslations } from '../types/customField';

/**
 * Parse fieldNameTranslations from JSON string
 */
export function parseFieldNameTranslations(json: string | null | undefined): FieldNameTranslations {
    if (!json) return {};
    try {
        return JSON.parse(json);
    } catch {
        return {};
    }
}

/**
 * Serialize fieldNameTranslations to JSON string
 */
export function serializeFieldNameTranslations(translations: FieldNameTranslations): string | null {
    if (!translations || Object.keys(translations).length === 0) return null;
    return JSON.stringify(translations);
}

/**
 * Get the translated field name for the given language, falling back to the default fieldName
 */
export function getTranslatedFieldName(
    fieldName: string,
    translationsJson: string | null | undefined,
    language: Language
): string {
    const translations = parseFieldNameTranslations(translationsJson);
    return translations[language] || fieldName;
}
