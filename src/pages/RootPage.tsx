import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MenuBar } from "../components/layout";
import { Suspense } from "react";
import { MemoryRouter } from 'react-router-dom';
import { CustomersPage } from "./CustomersPage";
import { EmployeePage } from "./EmployeePage";
import { HomePage } from "./HomePage";
import { SettingsPage } from "./SettingsPage";

export function RootPage() {
    return (
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MenuBar />
            <Suspense >
                <div style={{ maxWidth: "90%", margin: "0 auto", padding: "2rem" }}>
                    <Routes>
                        <Route
                            path="/"
                            element={<HomePage />}
                        />
                        <Route
                            path="/settings"
                            element={<SettingsPage />}
                        />
                        <Route
                            path="/customers"
                            element={<CustomersPage />}
                        />
                        <Route
                            path="/employee"
                            element={<EmployeePage />}
                        />
                    </Routes>
                </div>
            </Suspense>
        </MemoryRouter>
    );
}