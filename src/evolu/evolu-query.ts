import * as Evolu from "@evolu/common";
import { evolu } from "../evolu-init";
import type { CustomerId } from "./evolu-db";

export const settings: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("settings").select(["id", "language", "theme"])
);

export type TSettingsRow = typeof settings.Row;

export const customers: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customers")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TCustomerRow = typeof customers.Row;

export const customFields: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customFields")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
        .orderBy("createdAt", "desc")
);

export type TCustomFieldRow = typeof customFields.Row;

export const customFieldValues: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("customFieldValues")
        .selectAll()
        .where("isDeleted", "is not", Evolu.sqliteTrue)
);

export type TCustomFieldValueRow = typeof customFieldValues.Row;

export const getCustomFieldValuesForCustomer = (customerId: CustomerId): Evolu.Query =>
    evolu.createQuery((db) =>
        db.selectFrom("customFieldValues")
            .selectAll()
            .where("customerId", "==", customerId)
            .where("isDeleted", "is not", Evolu.sqliteTrue)
    );