import * as Evolu from "@evolu/common";

const SettingsId = Evolu.id("SettingsId");
export type SettingsId = typeof SettingsId.Type;

const Settings = {
    id: SettingsId,
    language: Evolu.NonEmptyString100,
    theme: Evolu.NonEmptyString100,
}

const CustomerId = Evolu.id("CustomerId");
export type CustomerId = typeof CustomerId.Type;

const Customer = {
    id: CustomerId,
    firstName: Evolu.nullOr(Evolu.NonEmptyString100),
    lastName: Evolu.nullOr(Evolu.NonEmptyString100),
    degree: Evolu.nullOr(Evolu.NonEmptyString100),
    birthDate: Evolu.nullOr(Evolu.NonEmptyString100),
    isAdult: Evolu.SqliteBoolean,
    sex: Evolu.nullOr(Evolu.NonEmptyString100),
    customerId: Evolu.nullOr(Evolu.NonEmptyString100)
}

export const Schema = {
    settings: Settings,
    customers: Customer
};