import React, { useState } from "react";
import {
    Box,
    Button,
    Typography,
    Card,
    CardContent,
    Stack,
    LinearProgress,
    Alert,
    TextField,
} from "@mui/material";
import {
    DataObject as DataObjectIcon,
    People as PeopleIcon,
    Badge as BadgeIcon,
    MedicalServices as MedicalServicesIcon,
    AccountBalanceWallet as CreditIcon,
    ShoppingCart as PreOrderIcon,
    Event as EventIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@evolu/react";
import { toast } from "react-toastify";
import { evolu } from "../../evolu-init";
import { customers, preOrderPrices, services, employees } from "../../evolu/evolu-query";
import * as Evolu from "@evolu/common";
import { ServiceId, CustomerId, PriceId, EmployeeId, CalendarEventId } from "../../evolu/evolu-db";

const FIRST_NAMES_MALE = [
    "James", "John", "Robert", "Michael", "William", "David", "Richard",
    "Joseph", "Thomas", "Christopher", "Charles", "Daniel", "Matthew",
    "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
    "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward",
    "Jason", "Jeffrey", "Ryan", "Jacob", "Gary", "Nicholas", "Eric",
    "Jonathan", "Stephen", "Larry", "Justin", "Scott", "Brandon",
];

const FIRST_NAMES_FEMALE = [
    "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth",
    "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty",
    "Margaret", "Sandra", "Ashley", "Dorothy", "Kimberly", "Emily",
    "Donna", "Michelle", "Carol", "Amanda", "Melissa", "Deborah",
    "Stephanie", "Rebecca", "Sharon", "Laura", "Cynthia", "Kathleen",
    "Amy", "Angela", "Shirley", "Anna", "Brenda", "Pamela", "Emma",
    "Nicole", "Helen",
];

const LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark",
    "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King",
    "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green",
    "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell",
    "Carter", "Roberts",
];

const DEGREES = ["M.D.", "Ph.D.", "Prof.", "Ing.", "RNDr.", "", "", "", "", ""];

const HOSPITAL_SERVICES: {
    name: string;
    duration: string;
    color: string;
    price: number;
    unitType: string;
}[] = [
    { name: "General Consultation", duration: "15", color: "#4CAF50", price: 50, unitType: "15m" },
    { name: "Blood Test", duration: "15", color: "#F44336", price: 25, unitType: "15m" },
    { name: "Blood Pressure Check", duration: "15", color: "#E91E63", price: 15, unitType: "15m" },
    { name: "X-Ray Examination", duration: "30", color: "#2196F3", price: 120, unitType: "30m" },
    { name: "Ultrasound", duration: "30", color: "#00BCD4", price: 150, unitType: "30m" },
    { name: "Dental Checkup", duration: "30", color: "#FF9800", price: 80, unitType: "30m" },
    { name: "MRI Scan", duration: "60", color: "#673AB7", price: 500, unitType: "1h" },
    { name: "CT Scan", duration: "60", color: "#3F51B5", price: 450, unitType: "1h" },
    { name: "Physical Therapy Session", duration: "60", color: "#009688", price: 90, unitType: "1h" },
    { name: "Surgery / Operation", duration: "120", color: "#D32F2F", price: 2500, unitType: "session" },
];

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

function randomDateOfBirth(): Date {
    const year = randomInt(1940, 2010);
    const month = randomInt(0, 11);
    const day = randomInt(1, 28);
    return new Date(year, month, day);
}

function randomPhone(): string {
    return `+1 ${randomInt(200, 999)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`;
}

function randomEmail(first: string, last: string): string {
    const domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mail.com"];
    return `${first.toLowerCase()}.${last.toLowerCase()}@${pick(domains)}`;
}

type SeedOperation = "customers" | "employees" | "services" | "credits" | "preOrders" | "events";

export function TemplateData() {
    const { t } = useTranslation();
    const [progress, setProgress] = useState<Record<SeedOperation, number>>({
        customers: 0,
        employees: 0,
        services: 0,
        credits: 0,
        preOrders: 0,
        events: 0,
    });
    const [isSeeding, setIsSeeding] = useState<Record<SeedOperation, boolean>>({
        customers: false,
        employees: false,
        services: false,
        credits: false,
        preOrders: false,
        events: false,
    });

    const [creditAmount, setCreditAmount] = useState("100");
    const allCustomers = useQuery(customers);
    const allServices = useQuery(services);
    const allEmployees = useQuery(employees);
    const allPreOrderPrices = useQuery(preOrderPrices);

    const isAnySeeding = Object.values(isSeeding).some(Boolean);

    const handleSeedCustomers = async () => {
        setIsSeeding((prev) => ({ ...prev, customers: true }));
        setProgress((prev) => ({ ...prev, customers: 0 }));
        const total = 1000;
        let created = 0;

        try {
            for (let i = 0; i < total; i++) {
                const sex = pick(["male", "female", "other"] as const);
                const firstName = sex === "male"
                    ? pick(FIRST_NAMES_MALE)
                    : sex === "female"
                        ? pick(FIRST_NAMES_FEMALE)
                        : pick([...FIRST_NAMES_MALE, ...FIRST_NAMES_FEMALE]);
                const lastName = pick(LAST_NAMES);
                const birthDate = randomDateOfBirth();
                const isAdult = birthDate.getFullYear() <= 2008;

                const result = await evolu.insert("customers", {
                    firstName,
                    lastName,
                    degree: pick(DEGREES) || null,
                    birthDate: birthDate.toISOString(),
                    isAdult: Evolu.booleanToSqliteBoolean(isAdult),
                    sex,
                    customerId: `C-${String(i + 1).padStart(5, "0")}`,
                });

                if (!result.ok) {
                    console.error(`Failed to create customer ${i + 1}:`, result.error);
                }

                created++;
                if (created % 50 === 0 || created === total) {
                    setProgress((prev) => ({ ...prev, customers: Math.round((created / total) * 100) }));
                    // Yield to UI
                    await new Promise((r) => setTimeout(r, 0));
                }
            }

            toast.success(t("settings.templateData.toast.customersCreated", { count: created }));
        } catch (error) {
            console.error("Failed to seed customers:", error);
            toast.error(t("settings.templateData.toast.customersError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, customers: false }));
        }
    };

    const handleSeedEmployees = async () => {
        setIsSeeding((prev) => ({ ...prev, employees: true }));
        setProgress((prev) => ({ ...prev, employees: 0 }));
        const total = 50;
        let created = 0;

        try {
            for (let i = 0; i < total; i++) {
                const sex = pick(["male", "female"] as const);
                const firstName = sex === "male"
                    ? pick(FIRST_NAMES_MALE)
                    : pick(FIRST_NAMES_FEMALE);
                const lastName = pick(LAST_NAMES);

                const result = await evolu.insert("employees", {
                    firstName,
                    lastName,
                    phone: randomPhone(),
                    email: randomEmail(firstName, lastName),
                });

                if (!result.ok) {
                    console.error(`Failed to create employee ${i + 1}:`, result.error);
                }

                created++;
                setProgress((prev) => ({ ...prev, employees: Math.round((created / total) * 100) }));
                await new Promise((r) => setTimeout(r, 0));
            }

            toast.success(t("settings.templateData.toast.employeesCreated", { count: created }));
        } catch (error) {
            console.error("Failed to seed employees:", error);
            toast.error(t("settings.templateData.toast.employeesError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, employees: false }));
        }
    };

    const handleSeedServices = async () => {
        setIsSeeding((prev) => ({ ...prev, services: true }));
        setProgress((prev) => ({ ...prev, services: 0 }));
        const total = HOSPITAL_SERVICES.length;
        let created = 0;

        try {
            for (const serviceData of HOSPITAL_SERVICES) {
                const serviceResult = await evolu.insert("services", {
                    name: serviceData.name,
                    description: null,
                    duration: serviceData.duration,
                    color: serviceData.color,
                });

                if (!serviceResult.ok) {
                    console.error(`Failed to create service ${serviceData.name}:`, serviceResult.error);
                    created++;
                    setProgress((prev) => ({ ...prev, services: Math.round((created / total) * 100) }));
                    continue;
                }

                const serviceId = serviceResult.value.id as ServiceId;

                await evolu.insert("prices", {
                    serviceId,
                    price: serviceData.price,
                    unitType: serviceData.unitType,
                    actualInTime: Evolu.booleanToSqliteBoolean(false),
                    validFrom: null,
                    validTo: null,
                    preOrderAllowed: Evolu.booleanToSqliteBoolean(true),
                    expirationAction: null,
                });

                created++;
                setProgress((prev) => ({ ...prev, services: Math.round((created / total) * 100) }));
                await new Promise((r) => setTimeout(r, 0));
            }

            toast.success(t("settings.templateData.toast.servicesCreated", { count: created }));
        } catch (error) {
            console.error("Failed to seed services:", error);
            toast.error(t("settings.templateData.toast.servicesError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, services: false }));
        }
    };

    const handleSeedCredits = async () => {
        const amount = parseFloat(creditAmount);
        if (!amount || amount <= 0) {
            toast.error(t("settings.templateData.toast.creditsInvalidAmount"));
            return;
        }

        if (!allCustomers || allCustomers.length === 0) {
            toast.error(t("settings.templateData.toast.creditsNoCustomers"));
            return;
        }

        const matched = allCustomers.filter(
            (c) => c.firstName && c.firstName.toUpperCase().startsWith("A"),
        );

        if (matched.length === 0) {
            toast.warning(t("settings.templateData.toast.creditsNoMatch"));
            return;
        }

        setIsSeeding((prev) => ({ ...prev, credits: true }));
        setProgress((prev) => ({ ...prev, credits: 0 }));
        let created = 0;
        const today = new Date().toISOString();

        try {
            for (const customer of matched) {
                const result = await evolu.insert("creditTransactions", {
                    customerId: customer.id as CustomerId,
                    employeeId: null,
                    amount,
                    date: today,
                    note: "Template data credit",
                });

                if (!result.ok) {
                    console.error(`Failed to add credit for customer ${customer.firstName}:`, result.error);
                }

                created++;
                if (created % 10 === 0 || created === matched.length) {
                    setProgress((prev) => ({ ...prev, credits: Math.round((created / matched.length) * 100) }));
                    await new Promise((r) => setTimeout(r, 0));
                }
            }

            toast.success(t("settings.templateData.toast.creditsCreated", { count: created, amount }));
        } catch (error) {
            console.error("Failed to seed credits:", error);
            toast.error(t("settings.templateData.toast.creditsError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, credits: false }));
        }
    };

    const handleSeedPreOrders = async () => {
        if (!allCustomers || allCustomers.length === 0) {
            toast.error(t("settings.templateData.toast.preOrdersNoCustomers", "No customers found. Generate customers first."));
            return;
        }

        const matched = allCustomers.filter((c) => {
            const first = (c.firstName || "").toUpperCase();
            const last = (c.lastName || "").toUpperCase();
            return first.includes("C") || last.includes("C");
        });

        if (matched.length === 0) {
            toast.warning(t("settings.templateData.toast.preOrdersNoMatch"));
            return;
        }

        if (!allPreOrderPrices || allPreOrderPrices.length === 0) {
            toast.error(t("settings.templateData.toast.preOrdersNoPrices"));
            return;
        }

        setIsSeeding((prev) => ({ ...prev, preOrders: true }));
        setProgress((prev) => ({ ...prev, preOrders: 0 }));
        let created = 0;
        const today = new Date().toISOString();

        try {
            for (const customer of matched) {
                const numOrders = randomInt(1, 3);
                for (let i = 0; i < numOrders; i++) {
                    const price = pick(allPreOrderPrices);
                    const quantity = randomInt(1, 2);
                    const amount = parseFloat(String(price.price)) * quantity;

                    const result = await evolu.insert("creditTransactions", {
                        customerId: customer.id as CustomerId,
                        employeeId: null,
                        amount,
                        date: today,
                        note: "Template pre-order",
                        priceId: price.id as PriceId,
                        serviceId: price.serviceId as ServiceId,
                        quantity,
                    });

                    if (!result.ok) {
                        console.error(`Failed to add pre-order for customer ${customer.firstName}:`, result.error);
                    }

                    created++;
                }

                if (created % 10 === 0 || created === matched.length * 3) {
                    setProgress((prev) => ({ ...prev, preOrders: Math.round((created / (matched.length * 3)) * 100) }));
                    await new Promise((r) => setTimeout(r, 0));
                }
            }

            toast.success(t("settings.templateData.toast.preOrdersCreated", { count: created, customerCount: matched.length }));
        } catch (error) {
            console.error("Failed to seed pre-orders:", error);
            toast.error(t("settings.templateData.toast.preOrdersError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, preOrders: false }));
        }
    };

    const handleSeedEvents = async () => {
        if (!allServices || allServices.length === 0) {
            toast.error(t("settings.templateData.toast.eventsNoServices"));
            return;
        }
        if (!allEmployees || allEmployees.length === 0) {
            toast.error(t("settings.templateData.toast.eventsNoEmployees"));
            return;
        }

        setIsSeeding((prev) => ({ ...prev, events: true }));
        setProgress((prev) => ({ ...prev, events: 0 }));
        const total = 45; // 15 per month × 3 months
        let created = 0;

        const EVENT_COLORS = [
            "#d32f2f", "#c2185b", "#9c27b0", "#3f51b5",
            "#1976d2", "#0097a7", "#2e7d32", "#fbc02d",
            "#ed6c02", "#455a64",
        ];

        try {
            const now = new Date();
            const months: { start: Date; end: Date }[] = [];

            // Build 3 month ranges: last month, current month, next month
            for (const offset of [-1, 0, 1]) {
                const year = now.getFullYear();
                const month = now.getMonth() + offset;
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0, 23, 59, 59);
                months.push({ start, end });
            }

            for (const { start: monthStart, end: monthEnd } of months) {
                for (let i = 0; i < 15; i++) {
                    // Pick a random weekday within the month
                    let day: Date;
                    let attempts = 0;
                    do {
                        day = new Date(
                            monthStart.getFullYear(),
                            monthStart.getMonth(),
                            randomInt(monthStart.getDate(), monthEnd.getDate()),
                        );
                        attempts++;
                    } while (day.getDay() === 0 || day.getDay() === 6 ? attempts < 50 : false);

                    if (day.getDay() === 0 || day.getDay() === 6) continue;

                    // Pick a random service
                    const service = pick(allServices);
                    const durationMinutes = parseInt(String(service.duration)) || 30;

                    // Random start hour (8-17) and minute (0, 15, 30, 45)
                    const startHour = randomInt(8, 17);
                    const startMinute = pick([0, 15, 30, 45]);
                    const startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startHour, startMinute);
                    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);

                    const result = await evolu.insert("calendarEvents", {
                        title: service.name,
                        description: null,
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        allDay: 0,
                        color: service.color || pick(EVENT_COLORS),
                        resource: String(service.id),
                        roomId: null,
                    });

                    if (!result.ok) {
                        console.error(`Failed to create event:`, result.error);
                        created++;
                        continue;
                    }

                    const eventId = result.value.id as CalendarEventId;

                    // Assign 1-2 random employees
                    const numEmployees = randomInt(1, Math.min(2, allEmployees.length));
                    const shuffledEmployees = [...allEmployees].sort(() => Math.random() - 0.5);
                    for (let e = 0; e < numEmployees; e++) {
                        await evolu.insert("calendarEventEmployees", {
                            calendarEventId: eventId,
                            employeeId: shuffledEmployees[e].id as EmployeeId,
                        });
                    }

                    // Assign 0-2 random customers (if available)
                    if (allCustomers && allCustomers.length > 0) {
                        const numCustomers = randomInt(0, Math.min(2, allCustomers.length));
                        const shuffledCustomers = [...allCustomers].sort(() => Math.random() - 0.5);
                        for (let c = 0; c < numCustomers; c++) {
                            await evolu.insert("calendarEventCustomers", {
                                calendarEventId: eventId,
                                customerId: shuffledCustomers[c].id as CustomerId,
                            });
                        }
                    }

                    created++;
                    if (created % 5 === 0 || created === total) {
                        setProgress((prev) => ({ ...prev, events: Math.round((created / total) * 100) }));
                        await new Promise((r) => setTimeout(r, 0));
                    }
                }
            }

            toast.success(t("settings.templateData.toast.eventsCreated", { count: created }));
        } catch (error) {
            console.error("Failed to seed events:", error);
            toast.error(t("settings.templateData.toast.eventsError"));
        } finally {
            setIsSeeding((prev) => ({ ...prev, events: false }));
        }
    };

    return (
        <Stack spacing={3}>
            <Alert severity="info">
                {t("settings.templateData.description")}
            </Alert>

            {/* Generate Customers */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PeopleIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.customers.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.customers.description")}
                        </Typography>
                        {isSeeding.customers && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.customers}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.customers}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<PeopleIcon />}
                            onClick={handleSeedCustomers}
                            disabled={isAnySeeding}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.customers
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.customers.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Generate Employees */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <BadgeIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.employees.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.employees.description")}
                        </Typography>
                        {isSeeding.employees && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.employees}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.employees}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<BadgeIcon />}
                            onClick={handleSeedEmployees}
                            disabled={isAnySeeding}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.employees
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.employees.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Generate Services */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <MedicalServicesIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.services.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.services.description")}
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                gap: 1,
                            }}
                        >
                            {HOSPITAL_SERVICES.map((s) => (
                                <Box
                                    key={s.name}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        p: 0.5,
                                        borderRadius: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            bgcolor: s.color,
                                            flexShrink: 0,
                                        }}
                                    />
                                    <Typography variant="caption">
                                        {s.name} — {s.price} ({s.unitType})
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        {isSeeding.services && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.services}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.services}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<MedicalServicesIcon />}
                            onClick={handleSeedServices}
                            disabled={isAnySeeding}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.services
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.services.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Add Credit for customers starting with "A" */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CreditIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.credits.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.credits.description")}
                        </Typography>
                        <TextField
                            label={t("settings.templateData.credits.amountLabel")}
                            type="number"
                            size="small"
                            value={creditAmount}
                            onChange={(e) => setCreditAmount(e.target.value)}
                            sx={{ maxWidth: 200 }}
                            inputProps={{ min: "1", step: "10" }}
                        />
                        {isSeeding.credits && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.credits}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.credits}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<CreditIcon />}
                            onClick={handleSeedCredits}
                            disabled={isAnySeeding}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.credits
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.credits.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Add Pre-orders for customers containing "C" */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <PreOrderIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.preOrders.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.preOrders.description")}
                        </Typography>
                        {isSeeding.preOrders && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.preOrders}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.preOrders}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<PreOrderIcon />}
                            onClick={handleSeedPreOrders}
                            disabled={isAnySeeding}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.preOrders
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.preOrders.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            {/* Generate Calendar Events */}
            <Card>
                <CardContent>
                    <Stack spacing={2}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <EventIcon color="primary" />
                            <Typography variant="h6">
                                {t("settings.templateData.events.title")}
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {t("settings.templateData.events.description")}
                        </Typography>
                        {isSeeding.events && (
                            <Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress.events}
                                    sx={{ mb: 1 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {progress.events}%
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            startIcon={<EventIcon />}
                            onClick={handleSeedEvents}
                            disabled={isAnySeeding || !allServices || allServices.length === 0 || !allEmployees || allEmployees.length === 0}
                            sx={{ alignSelf: "flex-start" }}
                        >
                            {isSeeding.events
                                ? t("settings.templateData.generating")
                                : t("settings.templateData.events.button")}
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
