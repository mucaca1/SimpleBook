import * as Evolu from "@evolu/common";

const SettingsId = Evolu.id("SettingsId");
export type SettingsId = typeof SettingsId.Type;

const Settings = {
    id: SettingsId,
    language: Evolu.NonEmptyString100,
    theme: Evolu.NonEmptyString100,
}

export const Schema = {
    settings: Settings,
};