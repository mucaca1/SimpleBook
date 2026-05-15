import React from "react";
import {
    Box, Typography, IconButton, Avatar, Tooltip,
} from "@mui/material";
import { PersonAdd } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useEmployeeCrud } from "../../hooks/useEmployeeCrud";
import type { TCalendarEventRow } from "../../evolu/evolu-query";

interface EventListProps {
    events: readonly TCalendarEventRow[];
    getEmployeeIdsForEvent: (eventId: string) => string[];
    onAssignClick: (event: TCalendarEventRow) => void;
}

export function EventList({ events, getEmployeeIdsForEvent, onAssignClick }: EventListProps) {
    const { t } = useTranslation();
    const { employees } = useEmployeeCrud();

    const employeeMap = React.useMemo(() => {
        const map = new Map<string, { name: string; initials: string }>();
        for (const emp of employees ?? []) {
            const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "?";
            const initials = `${String(emp.firstName ?? "")[0]}${String(emp.lastName ?? "")[0]}`.trim() || "?";
            map.set(String(emp.id), { name, initials });
        }
        return map;
    }, [employees]);

    if (events.length === 0) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
                {t("scheduler.upcomingEvents")}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {events.map((event) => {
                    const eIds = getEmployeeIdsForEvent(String(event.id));
                    const hasAssigned = eIds.length > 0;

                    return (
                        <Box
                            key={String(event.id)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                py: 0.5,
                                px: 1,
                                borderRadius: 1,
                                "&:hover": { bgcolor: "action.hover" },
                            }}
                        >
                            {event.color && (
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 32,
                                        borderRadius: 0.5,
                                        bgcolor: String(event.color),
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" noWrap>
                                    {String(event.title)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {String(event.start).replace("T", " ").slice(0, 16)}
                                </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                                {hasAssigned ? (
                                    eIds.map((eid) => {
                                        const emp = employeeMap.get(eid);
                                        if (!emp) return null;
                                        return (
                                            <Tooltip key={eid} title={emp.name}>
                                                <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                                                    {emp.initials}
                                                </Avatar>
                                            </Tooltip>
                                        );
                                    })
                                ) : (
                                    <Typography variant="caption" color="text.disabled">
                                        {t("scheduler.noEmployeesAssigned")}
                                    </Typography>
                                )}
                                <Tooltip title={t("scheduler.assignEmployees")}>
                                    <IconButton size="small" onClick={() => onAssignClick(event)}>
                                        <PersonAdd fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
