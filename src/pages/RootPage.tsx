import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MenuBar } from "../components/layout";
import { Suspense } from "react";
import { MemoryRouter } from 'react-router-dom';

export function RootPage() {
    return (
        <MemoryRouter initialEntries={['/']} initialIndex={0}>
            <MenuBar />
            <Suspense >
                <div style={{ maxWidth: "90%", padding: "2rem" }}>
                    <Routes>
                        <Route
                            path="/"
                            element={<div>hello</div>}
                        />
                        <Route
                            path="/settings"
                            element={<div>settings</div>}
                        />
                    </Routes>
                </div>
            </Suspense>
        </MemoryRouter>
    );
}