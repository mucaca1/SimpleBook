import * as Evolu from "@evolu/common";
import { evolu } from "../evolu-init";

export const settings: Evolu.Query = evolu.createQuery((db) =>
    db.selectFrom("settings").select(["id", "language", "theme"])
);

export type TSettingsRow = typeof settings.Row;