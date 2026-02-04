"use client";

import CustomTabPanel from "@/components/CustomTabPanel";
import RRAppBar from "@/components/RRAppBar";
import RRLiveLogs from "@/components/RRLiveLogs";
import RRLogSearch from "@/components/RRLogSearch";
import { EventsProvider } from "@/contexts/EventsContext";
import { useIsAuthed } from "@/hooks/Authed";
import { Box, Tab, Tabs } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { SnackbarProvider, useSnackbar } from "notistack";
import { Suspense, useEffect, useState } from "react";

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

function HomeContent() {
    const [selectedTab, setSelectedTab] = useState(0);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const searchParams = useSearchParams();

    const searchQueryJobId = searchParams.get("job_id");
    const router = useRouter();

    const { enqueueSnackbar } = useSnackbar();

    useIsAuthed("/login");

    useEffect(() => {
        fetch("/api/clean");
    }, [selectedTab, selectedJobId]);

    useEffect(() => {
        if (searchQueryJobId) {
            setSelectedJobId(searchQueryJobId);
            setSelectedTab(1);
        }
    }, [searchQueryJobId]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
    };

    return (
        <div>
            <RRAppBar/>
            <main className="max-w-6xl mx-auto m-8 gap-4 flex flex-col h-full">
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                    <Tabs
                        value={selectedTab}
                        onChange={handleChange}
                        aria-label="Tab select"
                    >
                        <Tab label="Search logs" {...a11yProps(0)} />
                        <Tab label="Server" {...a11yProps(1)} />
                    </Tabs>
                </Box>

                <CustomTabPanel value={selectedTab} index={0}>
                    <RRLogSearch
                        onSelectJobId={(JobId) => {
                            router.push(
                                "/admin?job_id=" + encodeURIComponent(JobId),
                            );
                            setSelectedTab(1);
                        }}
                    />
                </CustomTabPanel>

                <CustomTabPanel value={selectedTab} index={1}>
                    <RRLiveLogs
                        jobId={selectedJobId}
                        jobIdChange={setSelectedJobId}
                    />
                </CustomTabPanel>
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <EventsProvider>
            <SnackbarProvider maxSnack={8}>
                <Suspense fallback={<div>Loading...</div>}>
                    <HomeContent />
                </Suspense>
            </SnackbarProvider>
        </EventsProvider>
    );
}
