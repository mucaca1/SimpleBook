import * as Evolu from "@evolu/common";
import { evolu } from "../evolu-init";

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