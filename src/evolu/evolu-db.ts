import * as Evolu from "@evolu/common";

const SettingsId = Evolu.id("SettingsId");
export type SettingsId = typeof SettingsId.Type;

const Settings = {
    id: SettingsId,
    language: Evolu.NonEmptyString100,
    theme: Evolu.NonEmptyString100,
    calendarTimeFormat: Evolu.NonEmptyString100,
    calendarShowWeekends: Evolu.SqliteBoolean,
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

const CustomFieldId = Evolu.id("CustomFieldId");
export type CustomFieldId = typeof CustomFieldId.Type;

const CustomField = {
    id: CustomFieldId,
    appliesTo: Evolu.NonEmptyString100,
    fieldName: Evolu.NonEmptyString100,
    fieldType: Evolu.NonEmptyString100,
    fieldNameTranslations: Evolu.nullOr(Evolu.NonEmptyString1000),
    dropdownItems: Evolu.nullOr(Evolu.NonEmptyString1000),
    placeholder: Evolu.nullOr(Evolu.NonEmptyString1000),
    helpText: Evolu.nullOr(Evolu.NonEmptyString1000),
    required: Evolu.SqliteBoolean,
    editableAfterInitial: Evolu.SqliteBoolean,
    showInTable: Evolu.SqliteBoolean,
    containEmptyValue: Evolu.SqliteBoolean,
}

const CustomFieldValueId = Evolu.id("CustomFieldValueId");
export type CustomFieldValueId = typeof CustomFieldValueId.Type;

const EmployeeId = Evolu.id("EmployeeId");
export type EmployeeId = typeof EmployeeId.Type;

const Employee = {
    id: EmployeeId,
    firstName: Evolu.nullOr(Evolu.NonEmptyString100),
    lastName: Evolu.nullOr(Evolu.NonEmptyString100),
    phone: Evolu.nullOr(Evolu.NonEmptyString100),
    email: Evolu.nullOr(Evolu.NonEmptyString100),
}

const CalendarEventId = Evolu.id("CalendarEventId");
export type CalendarEventId = typeof CalendarEventId.Type;

const CalendarEvent = {
    id: CalendarEventId,
    title: Evolu.NonEmptyString1000,
    description: Evolu.nullOr(Evolu.NonEmptyString1000),
    start: Evolu.NonEmptyString100,
    end: Evolu.NonEmptyString100,
    allDay: Evolu.SqliteBoolean,
    color: Evolu.nullOr(Evolu.NonEmptyString100),
    resource: Evolu.nullOr(Evolu.NonEmptyString100),
}

const CustomFieldValue = {
    id: CustomFieldValueId,
    customFieldId: CustomFieldId,
    customerId: Evolu.nullOr(CustomerId),
    employeeId: Evolu.nullOr(EmployeeId),
    calendarEventId: Evolu.nullOr(CalendarEventId),
    value: Evolu.nullOr(Evolu.NonEmptyString1000)
}

const CalendarEventEmployeeId = Evolu.id("CalendarEventEmployeeId");
export type CalendarEventEmployeeId = typeof CalendarEventEmployeeId.Type;

const CalendarEventEmployee = {
    id: CalendarEventEmployeeId,
    calendarEventId: CalendarEventId,
    employeeId: EmployeeId,
}

const ServiceId = Evolu.id("ServiceId");
export type ServiceId = typeof ServiceId.Type;

const Service = {
    id: ServiceId,
    name: Evolu.NonEmptyString100,
    description: Evolu.nullOr(Evolu.NonEmptyString1000),
    duration: Evolu.NonEmptyString100,
    color: Evolu.nullOr(Evolu.NonEmptyString100),
}

export const Schema = {
    settings: Settings,
    customers: Customer,
    employees: Employee,
    customFields: CustomField,
    customFieldValues: CustomFieldValue,
    calendarEvents: CalendarEvent,
    calendarEventEmployees: CalendarEventEmployee,
    services: Service,
};