"use client";

import { useEventsContext } from "@/contexts/EventsContext";
import { useIsAuthed } from "@/hooks/Authed";
import { Log } from "@/lib/types"
import { Typography } from "@mui/material";
import Link from '@mui/material/Link';
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
type RRLiveLogsProps = {
    jobId: string | null;
    jobIdChange: (value: string) => void;
};

export default function RRLiveLogs({ jobId, jobIdChange }: RRLiveLogsProps) {
    useIsAuthed("/login");

    const [loading, setLoading] = useState(false);
    const { events, isConnected, error, clearEvents } = useEventsContext();
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        events.forEach(event => {
            if (event.event == "log-added") {
                event.rows.forEach((log: Log) => {
                    enqueueSnackbar(log.message, {
                        variant: "success",
                    });
                });
            }
        })
    }, [events])

    if (jobId == null)
        return <Typography className="text-center">No server selected...</Typography>;

    if (loading)
        return <Typography className="text-center">Loading...</Typography>;

    return (
        <div>
            <Typography variant="h6">Logs for Job {jobId}</Typography>
            <Typography><Link href={`https://www.roblox.com/games/start?launchData=${jobId}&placeId=114536923744844`}>Join server</Link>, may not be an active server!</Typography>
            

        </div>
    );
}
