"use client";

import PublicAppBar from "@/components/PublicAppBar";
import { Box } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import MetricsSection from "./MetricsSection";

function Home() {
    return (
        <>
            <PublicAppBar />

            <Box
                component="main"
                sx={{
                    maxWidth: "1400px",
                    mx: "auto",
                    mt: 4,
                    mb: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: "center",
                }}
            >
                <MetricsSection />
            </Box>
        </>
    );
}

export default function HomeWrapper() {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Home />
        </LocalizationProvider>
    );
}
