"use client";

import { useEventsContext } from "@/contexts/EventsContext";
import { useIsAuthed } from "@/hooks/Authed";
import { Log } from "@/lib/types";
import { Error, Info, Warning } from "@mui/icons-material";
import { Divider, List, Paper, Typography } from "@mui/material";
import Link from "@mui/material/Link";
import { uuidv4 } from "@/lib/uuid";
import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import OnlineIndicator from "./OnlineIndicator";

type RRLiveLogsProps = {
    jobId: string | null;
    jobIdChange: (value: string) => void;
};

type RobloxUser = {
    id: number;
    name: string;
    displayName: string;
};

const maxLogs = 200;

export default function RRLiveLogs({ jobId, jobIdChange }: RRLiveLogsProps) {
    useIsAuthed("/login");

    const { events, clearEvents } = useEventsContext();
    const { enqueueSnackbar } = useSnackbar();

    const [allLogs, setAllLogs] = useState<Log[]>([]);
    const [mostRecentTime, setMostRecentTime] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const getUserInfo = async (userId: number): Promise<RobloxUser> => {
        try {
            const res: Response = await fetch(
                `/api/roblox/get_user_info?userId=${userId}`,
            );
            if (!res.ok)
                return { id: userId, name: "Unknown", displayName: "Unknown" };
            return (await res.json()) as RobloxUser;
        } catch {
            return { id: userId, name: "Unknown", displayName: "Unknown" };
        }
    };

    const formatMessage = async (message: string, userId: number) => {
        if (
            !message.includes("USERNAME") &&
            !message.includes("DISPLAYNAME") &&
            !message.includes("USERID")
        )
            return message;
        const user = await getUserInfo(userId);
        return message
            .replaceAll("USERNAME", user.name)
            .replaceAll("DISPLAYNAME", user.displayName)
            .replaceAll("USERID", String(user.id));
    };

    const addLog = async (log: Log) => {
        log.message = await formatMessage(log.message, log.userid ?? 0);
        setMostRecentTime(new Date());

        const logAlreadyExists = allLogs.find(
            (prevLog) => prevLog.log_id === log.log_id,
        );

        if (!logAlreadyExists) setAllLogs((prev) => [...prev, log]);
    };

    useEffect(() => {
        if (allLogs.length > maxLogs) {
            setAllLogs((prev) => prev.slice(-maxLogs));
        }
    }, [allLogs]);

    useEffect(() => {
        events.forEach((event) => {
            if (event.event === "log-added") {
                let rows: Log[] = event.rows

                rows = rows.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

                rows.forEach((log: Log) => {
                    if (log.server_id === jobId) {
                        addLog(log);
                    }
                });
            }
        });

        if (events.length > 0) clearEvents();
    }, [events, jobId]);

    useEffect(() => {
        fetch("/api/log?server_id=" + encodeURIComponent(jobId ?? "studio"))
            .then((res) => res.json())
            .then((logs) => {
                logs.forEach((log: Log) => {
                    addLog(log);
                });
            });
    }, []);

    if (!jobId)
        return (
            <Typography className="text-center">
                No server selected...
            </Typography>
        );

    return (
        <div>
            <Typography variant="h6">Logs for Job {jobId}</Typography>
            <Typography>
                <Link
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        const url = `https://www.roblox.com/games/start?launchData=${jobId}&placeId=114536923744844`;
                        const popup = window.open(
                            url,
                            "robloxPopup",
                            "width=900,height=700,resizable=yes,scrollbars=yes",
                        );
                        if (
                            !popup ||
                            popup.closed ||
                            typeof popup.closed === "undefined"
                        ) {
                            window.open(url, "_blank", "noopener,noreferrer");
                        }
                    }}
                >
                    Open in Roblox
                </Link>
            </Typography>

            <OnlineIndicator mostRecentTime={mostRecentTime} />

            <Paper
                ref={containerRef}
                className="h-128 overflow-auto mt-2 flex flex-col-reverse px-4"
            >
                <List>
                    {allLogs.map((log) => (
                        <div key={log.log_id}>
                            <Divider />
                            <div className="flex items-center my-1 gap-1">
                                {(() => {
                                    switch (String(log.level)) {
                                        case "1":
                                            return <Info color="info" />;
                                        case "2":
                                            return <Warning color="warning" />;
                                        case "3":
                                            return <Error color="error" />;
                                        default:
                                            return null;
                                    }
                                })()}
                                <Typography
                                    className="flex-1"
                                    color={
                                        ["info", "warning", "error"][
                                            log.level - 1
                                        ] as "info" | "warning" | "error"
                                    }
                                >
                                    {log.message}{" "}
                                </Typography>
                                <Typography className="italic">
                                    {new Date(log.logged_at).toLocaleString()}
                                </Typography>
                            </div>
                        </div>
                    ))}
                    <Divider />
                </List>
                {loading && (
                    <Typography className="text-center">Loading...</Typography>
                )}
            </Paper>
        </div>
    );
}
