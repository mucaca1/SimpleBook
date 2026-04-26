import type { EventCalendarLocaleText } from "@mui/x-scheduler/models/translations";

export const skSKSchedulerLocaleText: Partial<EventCalendarLocaleText> = {
  // EventDialog
  colorPickerLabel: "Farba udalosti",
  dateTimeSectionLabel: "Dátum a čas",
  resourceColorSectionLabel: "Prostriedok a farba",
  allDayLabel: "Celý deň",
  closeButtonAriaLabel: "Zavrieť",
  closeButtonLabel: "Zavrieť",
  deleteEvent: "Odstrániť udalosť",
  descriptionLabel: "Popis",
  endDateLabel: "Dátum ukončenia",
  endTimeLabel: "Čas ukončenia",
  eventTitleAriaLabel: "Názov udalosti",
  generalTabLabel: "Všeobecné",
  labelNoResource: "Žiadny prostriedok",
  labelInvalidResource: "Neplatný prostriedok",
  recurrenceLabel: "Opakovanie",
  recurrenceNoRepeat: "Neopakovať",
  recurrenceCustomRepeat: "Vlastné pravidlo opakovania",
  recurrenceDailyPresetLabel: "Opakuje sa denne",
  recurrenceDailyFrequencyLabel: "dní",
  recurrenceEndsLabel: "Končí",
  recurrenceEndsAfterLabel: "Po",
  recurrenceEndsNeverLabel: "Nikdy",
  recurrenceEndsUntilLabel: "Do",
  recurrenceEndsTimesLabel: "krát",
  recurrenceEveryLabel: "Každých",
  recurrenceRepeatLabel: "Opakovať",
  recurrenceTabLabel: "Opakovanie",
  recurrenceMainSelectCustomLabel: "Opakovanie",
  recurrenceWeeklyFrequencyLabel: "týždňov",
  recurrenceWeeklyPresetLabel: (weekday) =>
    `Opakuje sa týždenne v ${weekday}`,
  recurrenceMonthlyFrequencyLabel: "mesiacov",
  recurrenceMonthlyDayOfMonthLabel: (dayNumber) => `Deň ${dayNumber}`,
  recurrenceMonthlyLastWeekAriaLabel: (weekDay) =>
    `${weekDay} posledného týždňa v mesiaci`,
  recurrenceMonthlyLastWeekLabel: (weekDay) =>
    `${weekDay} posledný týždeň`,
  recurrenceMonthlyPresetLabel: (dayNumber) =>
    `Opakuje sa mesačne ${dayNumber}. deň`,
  recurrenceMonthlyWeekNumberAriaLabel: (ord, weekDay) =>
    `${weekDay} ${ord}. týždeň v mesiaci`,
  recurrenceMonthlyWeekNumberLabel: (ord, weekDay) =>
    `${weekDay} ${ord}. týždeň`,
  recurrenceWeeklyMonthlySpecificInputsLabel: "V",
  recurrenceYearlyFrequencyLabel: "rokov",
  recurrenceYearlyPresetLabel: (date) => `Opakuje sa ročne ${date}`,
  noResourceAriaLabel: "Žiadny konkrétny prostriedok",
  resourceLabel: "Prostriedok",
  saveChanges: "Uložiť",
  startDateAfterEndDateError:
    "Dátum/čas začiatku musí byť pred dátumom/časom ukončenia.",
  startDateLabel: "Dátum začiatku",
  startTimeLabel: "Čas začiatku",
  // ScopeDialog
  all: "Všetky udalosti",
  cancel: "Zrušiť",
  confirm: "Potvrdiť",
  onlyThis: "Len táto udalosť",
  radioGroupAriaLabel: "Rozsah úpravy opakujúcich sa udalostí",
  thisAndFollowing: "Táto a nasledujúce udalosti",
  title: "Použiť túto zmenu na:",
  // ResourcesLegend
  hideEventsLabel: (resourceName) =>
    `Skryť udalosti pre ${resourceName}`,
  resourcesLabel: "Prostriedky",
  resourcesLegendSectionLabel: "Legenda prostriedkov",
  showEventsLabel: (resourceName) =>
    `Zobraziť udalosti pre ${resourceName}`,
  // ViewSwitcher
  agenda: "Agenda",
  day: "Deň",
  month: "Mesiac",
  other: "Iné",
  today: "Dnes",
  week: "Týždeň",
  time: "Čas",
  days: "Dni",
  months: "Mesiace",
  weeks: "Týždne",
  years: "Roky",
  // DateNavigator
  closeSidePanel: "Zavrieť bočný panel",
  openSidePanel: "Otvoriť bočný panel",
  // Preferences menu
  amPm12h: "12-hodinový (1:00 PM)",
  hour24h: "24-hodinový (13:00)",
  preferencesMenu: "Nastavenia",
  showWeekends: "Zobraziť víkendy",
  showEmptyDaysInAgenda: "Zobraziť prázdne dni",
  showWeekNumber: "Zobraziť číslo týždňa",
  timeFormat: "Formát času",
  viewSpecificOptions: (view) => `Možnosti zobrazenia ${view}`,
  // WeekView
  allDay: "Celý deň",
  // MonthView
  hiddenEvents: (hiddenEventsCount) => `${hiddenEventsCount} ďalších...`,
  nextTimeSpan: (timeSpan) => `Ďalší ${timeSpan}`,
  previousTimeSpan: (timeSpan) => `Predošlý ${timeSpan}`,
  resourceAriaLabel: (resourceName) => `Prostriedok: ${resourceName}`,
  weekAbbreviation: "T",
  weekNumberAriaLabel: (weekNumber) => `Týždeň ${weekNumber}`,
  // EventItem
  eventItemMultiDayLabel: (endDate) => `Končí ${endDate}`,
  // MiniCalendar
  miniCalendarLabel: "Kalendár",
  miniCalendarGoToPreviousMonth: "Zobraziť predchádzajúci mesiac",
  miniCalendarGoToNextMonth: "Zobraziť nasledujúci mesiac",
  // Timeline
  timelineResourceTitleHeader: "Názov prostriedku",
};
