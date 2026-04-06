# General
The goal is to create an application that will manage the company, employees, customers, payroll, and orders, including their processing.

The app will track employees, their tasks, task schedules, customer schedules, and customer payments.

# Dashboard
Dashboard: the main page. It contains a calendar displaying orders (An "order" is a general term. The primary client for the entire application is the healthcare facility where the exercise takes place.
This means that an order is a booking for a specific exercise, but it can be any type of order. For example, a dentist, a personal trainer, and the like.).
If only one employee is assigned to an order and that employee has a selected color, the block in the calendar will have that color. If more than one employee is assigned, select a random color that none of the employees has.
The calendar will include a filter where I can select a specific employee I want to view. I can also select multiple employees. The default setting displays all employees.
A new appointment can be created using the button or by clicking in the calendar.
After clicking on an appointment, the user can choose whether to edit, cancel, or mark it as completed.
Marking an appointment as completed is a process that records which employees and customers actually attended (it is possible that someone did not show up for the appointment).
For those who attended, a record is created stating that they arrived for the appointment and were present. Otherwise, a record of absence is created.

# Settings
Settings: The Settings page will contain the application's settings. For example, language, theme, menu, time format, color scheme, calendar colors, and enabled modules (modules should be part of the application that can be turned on or off depending on whether the user wants to use them or not).
Settings / Value Customization Module: The settings may or may not include an option for customizing the values of Employees, Customers, and Orders. The purpose of this module is that not all features necessary for a specific application user may be sufficient. Therefore, the user can define additional possible attributes for employees, customers, and orders. The additional value contains the following settings: Type (whether the value applies to an employee, customer, or order), name, value type (String, Number, Date, etc.), whether the value can be null (whether it is required), whether the value can be edited after entry, or whether it must remain non-editable.
Create dynamic fields using the EAV model (Entity-Attribute-Value)

# Pricing
Session Management and Pricing:
Users can create different types of bookings and set their prices within the app. For example, one type of booking could be a workout, and another could be a consultation. They can then set prices for these different types of bookings. For example, a consultation might cost 30 euros and a workout 60 euros. It is also possible to set a time unit. For example, 60 euros for half an hour. It is then possible to set a quantity discount. For example, if six training sessions are pre-ordered, the last one will be free.
In client management, it is therefore possible to pre-order credit for a specific training session. For example, a client might purchase two session slots for workouts and one slot for a consultation. These slots can be used in the future.
If the client attends a workout and it is possible to deduct the session from their prepaid balance based on the session type, the prepaid time will be reduced by the specific amount. If they do not have sufficient credit, they must pay immediately, and a record of the prepaid time top-up will be created, which will then be deducted; alternatively, the user can go into negative prepaid hours and pay the difference later.