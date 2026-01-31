"use client";

import { useIsAuthed } from "@/hooks/Authed";
import React, { Fragment, useEffect, useState } from "react";
import RRAppBar from "@/components/RRAppBar";
import { EventsProvider, useEventsContext } from "@/contexts/EventsContext";
import {
    Paper,
    TextField,
    Checkbox,
    FormControlLabel,
    Skeleton,
    Icon,
    Box,
    Typography,
    Divider,
    Tooltip,
} from "@mui/material";
import {
    Cloud,
    Computer,
    Dataset,
    Dns,
    Error,
    Info,
    Warning,
} from "@mui/icons-material";
import { green } from "@mui/material/colors";
import HtmlTooltip from "@/components/HtmlTooltip";

function HomeContent() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Log[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
    const [checkBox1, setCheckBox1] = useState(false);
    const [checkBox2, setCheckBox2] = useState(false);
    const [checkBox3, setCheckBox3] = useState(false);
    const [serverEnvironment, setServerEnvironment] = useState(false);
    const [clientEnvironment, setClientEnvironment] = useState(false);

    useIsAuthed("/login");

    const { events, isConnected, error, clearEvents } = useEventsContext();

    const handleCheckboxChange = (boxNumber: 1 | 2 | 3) => {
        if (boxNumber === 1) setCheckBox1(!checkBox1);
        if (boxNumber === 2) setCheckBox2(!checkBox2);
        if (boxNumber === 3) setCheckBox3(!checkBox3);
    };

    const search = async (query: string) => {
        setLoading(true);
        let url = `/api/search/messages?search=${encodeURIComponent(query)}`;

        let searchLevelsParam = "";
        let searchEnvParam = "";

        if (checkBox1 || checkBox2 || checkBox3) {
            searchLevelsParam = "&levels=";
            const levels = [];

            if (checkBox1) levels.push("1");
            if (checkBox2) levels.push("2");
            if (checkBox3) levels.push("3");

            searchLevelsParam += levels.join(",");
        }

        if (serverEnvironment || clientEnvironment) {
            searchEnvParam = "&environments=";
            const environments = [];

            if (serverEnvironment) environments.push("Server");
            if (clientEnvironment) environments.push("Client");

            searchEnvParam += environments.join(",");
        }

        url = url + searchLevelsParam + searchEnvParam;

        try {
            const response = await fetch(url);
            const result = await response.json();
            setData(result);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            search(searchQuery);
            if (!hasInitiallyFetched) {
                setHasInitiallyFetched(true);
            }
        }, 200);

        return () => clearTimeout(searchTimeout);
    }, [
        searchQuery,
        checkBox1,
        checkBox2,
        checkBox3,
        serverEnvironment,
        clientEnvironment,
    ]);

    useEffect(() => {
        if (events.length === 0) return;

        let updatedData = [...(data ?? [])];

        console.log(events)

        events.forEach((event) => {
            if (event.event === "log-added") {
                event.rows.forEach((log: Log) => {
                    if (
                        (log.level === 1 && !checkBox1) ||
                        (log.level === 2 && !checkBox2) ||
                        (log.level === 3 && !checkBox3) ||
                        (log.environment === "Server" && !serverEnvironment) ||
                        (log.environment === "Client" && !clientEnvironment)
                    )
                        return;

                    const existingIndex = updatedData.findIndex(
                        (existingLog) =>
                            existingLog.message_lower === log.message_lower,
                    );

                    if (existingIndex === -1) {
                        updatedData.push({ ...log, count: 1 });
                    } else {
                        const existingLog = updatedData[existingIndex];
                        updatedData[existingIndex] = {
                            ...existingLog,
                            count: (existingLog.count ?? 1) + 1,
                            logged_at: log.logged_at ?? existingLog.logged_at,
                        };
                    }
                });
            }
        });

        setData(updatedData);
        clearEvents();
    }, [
        events,
        data,
        checkBox1,
        checkBox2,
        checkBox3,
        serverEnvironment,
        clientEnvironment,
    ]);

    return (
        <div>
            <RRAppBar />
            <main className="max-w-6xl mx-auto my-8 gap-4 flex h-full">
                <Paper className="px-4 py-2 flex flex-col h-fit select-none">
                    <Typography variant="h6">Filter search</Typography>
                    <Typography variant="subtitle1">Log levels</Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checkBox1}
                                onChange={() => handleCheckboxChange(1)}
                            />
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Info color="info" fontSize="small" />
                                Info
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checkBox2}
                                onChange={() => handleCheckboxChange(2)}
                            />
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Warning color="warning" fontSize="small" />
                                Warning
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={checkBox3}
                                onChange={() => handleCheckboxChange(3)}
                            />
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Error color="error" fontSize="small" />
                                Error
                            </Box>
                        }
                    />
                    <Divider />
                    <Typography variant="subtitle1">
                        Log environments
                    </Typography>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={serverEnvironment}
                                onChange={() => setServerEnvironment((v) => !v)}
                            />
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Dns color="info" fontSize="small" />
                                Server
                            </Box>
                        }
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={clientEnvironment}
                                onChange={() => setClientEnvironment((v) => !v)}
                            />
                        }
                        label={
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Computer
                                    sx={{ color: green[500] }}
                                    fontSize="small"
                                />
                                Client
                            </Box>
                        }
                    />
                </Paper>

                <div className="flex flex-col gap-4 w-full h-full">
                    <Paper className="flex flex-col w-full">
                        <TextField
                            variant="outlined"
                            label="Search"
                            type="search"
                            className="w-full"
                            spellCheck
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key == "Enter") {
                                    search(searchQuery);
                                }
                            }}
                        />
                    </Paper>

                    <Paper className="h-full w-full p-4 max-h-full overflow-auto">
                        {loading ? (
                            <Box className="flex flex-col gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                        }}
                                    >
                                        <Skeleton
                                            variant="circular"
                                            width={24}
                                            height={24}
                                        />

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Skeleton height={20} width="80%" />
                                            <Skeleton height={16} width="40%" />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        ) : data?.length === 0 ? (
                            <Typography
                                color="text.secondary"
                                className="italic"
                            >
                                No results for "{searchQuery}"
                            </Typography>
                        ) : (
                            data?.map((item: any, index: number) => {
                                return (
                                    <HtmlTooltip
                                        key={item.log_id}
                                        title={
                                            <Fragment>
                                                <Typography variant="h6">
                                                    {(() => {
                                                        switch (item.level) {
                                                            case "1":
                                                                return "Info";
                                                            case "2":
                                                                return "Warning";
                                                            case "3":
                                                                return "Error";
                                                            default:
                                                                return "Unknown log level";
                                                        }
                                                    })()}{" "}
                                                    -{" "}
                                                    {(() => {
                                                        switch (
                                                            item.environment
                                                        ) {
                                                            case "Server":
                                                                return (
                                                                    <>
                                                                        Server{" "}
                                                                        <Dns color="info" />
                                                                    </>
                                                                );
                                                            case "Client":
                                                                return (
                                                                    <>
                                                                        Client{" "}
                                                                        <Computer
                                                                            sx={{
                                                                                color: green[500],
                                                                            }}
                                                                        />
                                                                    </>
                                                                );
                                                        }
                                                    })()}{" "}
                                                </Typography>
                                                <Typography>
                                                    Most recent occurrence:{" "}
                                                    {item.logged_at
                                                        ? new Date(
                                                              item.logged_at,
                                                          ).toLocaleString(
                                                              undefined,
                                                              {
                                                                  dateStyle:
                                                                      "medium",
                                                                  timeStyle:
                                                                      "short",
                                                              },
                                                          )
                                                        : "—"}
                                                </Typography>
                                            </Fragment>
                                        }
                                        followCursor={true}
                                    >
                                        <div
                                            key={item.id || index}
                                            className="flex gap-2 my-1"
                                        >
                                            {(() => {
                                                switch (item.level) {
                                                    case "1":
                                                        return (
                                                            <Info color="info" />
                                                        );
                                                    case "2":
                                                        return (
                                                            <Warning color="warning" />
                                                        );
                                                    case "3":
                                                        return (
                                                            <Error color="error" />
                                                        );
                                                    default:
                                                        return null;
                                                }
                                            })()}
                                            <Typography
                                                color={
                                                    [
                                                        "info",
                                                        "warning",
                                                        "error",
                                                    ][item.level - 1] as
                                                        | "info"
                                                        | "warning"
                                                        | "error"
                                                }
                                            >
                                                <b>({item.count}x)</b>{" "}
                                                {item.message}
                                            </Typography>
                                        </div>
                                    </HtmlTooltip>
                                );
                            })
                        )}
                    </Paper>
                </div>
            </main>
        </div>
    );
}

export default function Home() {
    return (
        <EventsProvider>
            <HomeContent />
        </EventsProvider>
    );
}
