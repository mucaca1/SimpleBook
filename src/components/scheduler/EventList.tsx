import React, { useState, useMemo } from "react";
import {
    Box, Typography, Avatar, Tooltip, IconButton, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { Edit, People, Person } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useEmployeeCrud } from "../../hooks/useEmployeeCrud";
import { useCustomerCrud } from "../../hooks/useCustomerCrud";
import type { TCalendarEventRow } from "../../evolu/evolu-query";

const MAX_VISIBLE = 3;
const MAX_ITEMS = 5;

interface EventListProps {
    events: readonly TCalendarEventRow[];
    getEmployeeIdsForEvent: (eventId: string) => string[];
    getCustomerIdsForEvent: (eventId: string) => string[];
    onEditEvent: (event: TCalendarEventRow) => void;
}

export function EventList({ events, getEmployeeIdsForEvent, getCustomerIdsForEvent, onEditEvent }: EventListProps) {
    const { t } = useTranslation();
    const { employees } = useEmployeeCrud();
    const { customers } = useCustomerCrud();
    const [showCustomers, setShowCustomers] = useState(false);

    const employeeMap = React.useMemo(() => {
        const map = new Map<string, { name: string; initials: string }>();
        for (const emp of employees ?? []) {
            const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || "?";
            const initials = `${String(emp.firstName ?? "")[0]}${String(emp.lastName ?? "")[0]}`.trim() || "?";
            map.set(String(emp.id), { name, initials });
        }
        return map;
    }, [employees]);

    const customerMap = React.useMemo(() => {
        const map = new Map<string, { name: string; initials: string }>();
        for (const cust of customers ?? []) {
            const name = `${cust.firstName ?? ""} ${cust.lastName ?? ""}`.trim() || "?";
            const initials = `${String(cust.firstName ?? "")[0]}${String(cust.lastName ?? "")[0]}`.trim() || "?";
            map.set(String(cust.id), { name, initials });
        }
        return map;
    }, [customers]);

    const { upcoming, past } = useMemo(() => {
        const now = new Date().toISOString();
        const sorted = [...events].sort((a, b) => String(a.start).localeCompare(String(b.start)));
        const futureEvents = sorted.filter((e) => String(e.start) >= now);
        const pastEvents = sorted.filter((e) => String(e.start) < now).reverse();
        return {
            upcoming: futureEvents.slice(0, MAX_ITEMS),
            past: pastEvents.slice(0, MAX_ITEMS),
        };
    }, [events]);

    const renderToggle = () => (
        <ToggleButtonGroup
            size="small"
            value={showCustomers ? "customers" : "employees"}
            exclusive
            onChange={(_, v) => { if (v) setShowCustomers(v === "customers"); }}
        >
            <ToggleButton value="employees" sx={{ px: 1.25, py: 0.25 }}>
                <Tooltip title={t("scheduler.toggleEmployees")}>
                    <Person sx={{ fontSize: 18 }} />
                </Tooltip>
            </ToggleButton>
            <ToggleButton value="customers" sx={{ px: 1.25, py: 0.25 }}>
                <Tooltip title={t("scheduler.toggleCustomers")}>
                    <People sx={{ fontSize: 18 }} />
                </Tooltip>
            </ToggleButton>
        </ToggleButtonGroup>
    );

    const renderEventItem = (event: TCalendarEventRow) => {
        const personMap = showCustomers ? customerMap : employeeMap;
        const ids = showCustomers
            ? getCustomerIdsForEvent(String(event.id))
            : getEmployeeIdsForEvent(String(event.id));
        const visible = ids.slice(0, MAX_VISIBLE);
        const overflow = ids.slice(MAX_VISIBLE);

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
                <IconButton
                    size="small"
                    onClick={() => onEditEvent(event)}
                    sx={{ flexShrink: 0 }}
                >
                    <Edit sx={{ fontSize: 16 }} />
                </IconButton>
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
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0 }}>
                    {ids.length === 0 ? (
                        <Typography variant="caption" color="text.disabled">
                            {t("scheduler.noOneAssigned")}
                        </Typography>
                    ) : (
                        <>
                            {visible.map((id) => {
                                const person = personMap.get(id);
                                if (!person) return null;
                                return (
                                    <Tooltip key={id} title={person.name}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                                            {person.initials}
                                        </Avatar>
                                    </Tooltip>
                                );
                            })}
                            {overflow.length > 0 && (
                                <Tooltip
                                    title={overflow.map(id => personMap.get(id)?.name).filter(Boolean).join(", ")}
                                >
                                    <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "grey.400" }}>
                                        +{overflow.length}
                                    </Avatar>
                                </Tooltip>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        );
    };

    if (events.length === 0) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                    {t("scheduler.upcomingEvents")}
                </Typography>
                {renderToggle()}
            </Box>
            {upcoming.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {upcoming.map(renderEventItem)}
                </Box>
            ) : (
                <Typography variant="body2" color="text.disabled" sx={{ pl: 1 }}>
                    —
                </Typography>
            )}

            {past.length > 0 && (
                <>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                        <Typography variant="h6" sx={{ flex: 1 }}>
                            {t("scheduler.pastEvents")}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                        {past.map(renderEventItem)}
                    </Box>
                </>
            )}
        </Box>
    );
}
