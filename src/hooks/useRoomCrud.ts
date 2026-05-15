import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { evolu } from "../evolu-init";
import { rooms } from "../evolu/evolu-query";
import { RoomFormData } from "../types/room";
import type { TRoomRow } from "../evolu/evolu-query";
import { RoomId } from "../evolu/evolu-db";
import * as Evolu from "@evolu/common";

interface UseRoomCrudReturn {
    rooms: TRoomRow[];
    isLoading: boolean;
    createRoom: (data: RoomFormData) => Promise<RoomId>;
    updateRoom: (id: RoomId, data: RoomFormData) => Promise<void>;
    deleteRoom: (id: RoomId) => Promise<void>;
}

export function useRoomCrud(): UseRoomCrudReturn {
    const { t } = useTranslation();

    const result = useQuery(rooms);

    const createRoom = async (data: RoomFormData): Promise<RoomId> => {
        try {
            const result = await evolu.insert("rooms", {
                name: data.name,
                color: data.color || null,
                maxCapacity: data.maxCapacity,
                countChildrenAsPerson: Evolu.booleanToSqliteBoolean(data.countChildrenAsPerson),
            });

            if (result.ok) {
                toast.success(t("room.toast.created"));
                return result.value.id;
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to create room:", error);
            toast.error(t("room.toast.createError"));
            throw error;
        }
    };

    const updateRoom = async (id: string, data: RoomFormData): Promise<void> => {
        try {
            const result = await evolu.update("rooms", {
                id,
                name: data.name,
                color: data.color || null,
                maxCapacity: data.maxCapacity,
                countChildrenAsPerson: Evolu.booleanToSqliteBoolean(data.countChildrenAsPerson),
            });

            if (result.ok) {
                toast.success(t("room.toast.updated"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to update room:", error);
            toast.error(t("room.toast.updateError"));
            throw error;
        }
    };

    const deleteRoom = async (id: string): Promise<void> => {
        try {
            const result = await evolu.update("rooms", {
                id,
                isDeleted: Evolu.booleanToSqliteBoolean(true),
            });

            if (result.ok) {
                toast.success(t("room.toast.deleted"));
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            console.error("Failed to delete room:", error);
            toast.error(t("room.toast.deleteError"));
            throw error;
        }
    };

    return {
        rooms: result,
        isLoading: result === undefined || result === null,
        createRoom,
        updateRoom,
        deleteRoom,
    };
}
