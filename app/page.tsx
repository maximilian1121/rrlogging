"use client";

import AdminButton from "@/components/AdminButton";
import { AbbreviateNumber } from "@/lib/types";
import {
    AccountCircle,
    Star,
    ThumbDown,
    ThumbUp,
    TrendingUp,
} from "@mui/icons-material";
import { AppBar, Box, Paper, Toolbar, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

interface Metric {
    id: string;
    active: string;
    visits: string;
    likes: string;
    dislikes: string;
    favorites: string;
    recorded_at: string;
}

interface RealtimeMetric {
    active_players: number;
    visits: number;
    likes: number;
    dislikes: number;
    favorites: number;
    rate_limits: {
        stats_fetch: { max: number; remaining: number; reset_in: number };
        votes_fetch: { max: number; remaining: number; reset_in: number };
    };
}

function Home() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Metric[]>([]);
    const [dateRangeStart, setDateRangeStart] = useState<Dayjs>(
        dayjs().subtract(24, "hour"),
    );
    const [dateRangeEnd, setDateRangeEnd] = useState<Dayjs>(dayjs());
    const [realtimeMetrics, setRealtimeMetrics] =
        useState<RealtimeMetric | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let isMounted = true;

        const connect = () => {
            console.log("Connecting to SSE...");
            const es = new EventSource("/api/public/realtime-metrics");
            eventSourceRef.current = es;

            es.addEventListener("realtime-metrics", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log("Got SSE data:", data);
                    setRealtimeMetrics(data);
                } catch (err) {
                    console.error("Failed to parse SSE:", err);
                }
            });

            es.addEventListener("keepalive", () => {});

            es.onerror = (err) => {
                console.error("SSE error, reconnecting in 3s...", err);
                es.close();

                retryTimeoutRef.current = setTimeout(() => {
                    connect();
                }, 3000);
            };
        };

        connect();

        return () => {
            isMounted = false;
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch(
            `/api/public/get-chart-data?dateRange=${dateRangeStart.toISOString()}_${dateRangeEnd.toISOString()}`,
        )
            .then((res) => res.json())
            .then((data: Metric[]) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [dateRangeStart, dateRangeEnd]);

    const xAxisData: number[] = data.map((item) =>
        isNaN(dayjs(item.recorded_at).valueOf())
            ? 0
            : dayjs(item.recorded_at).valueOf(),
    );
    const yAxisDataActive: number[] = data.map(
        (item) => Number(item.active) || 0,
    );
    const yAxisDataVisits: number[] = data.map(
        (item) => Number(item.visits) || 0,
    );
    const yAxisDataLikes: number[] = data.map(
        (item) => Number(item.likes) || 0,
    );
    const yAxisDataDislikes: number[] = data.map(
        (item) => Number(item.dislikes) || 0,
    );
    const yAxisDataFavorites: number[] = data.map(
        (item) => Number(item.favorites) || 0,
    );

    const formatDate = (timestamp: number) =>
        dayjs(timestamp).format("MMM DD, YYYY h:mm A");

    const chartHeights = 300;

    const charts = [
        { label: "Active Players", data: yAxisDataActive, showMark: false },
        { label: "Total Visits", data: yAxisDataVisits, showMark: false },
        {
            label: "Likes to Dislikes",
            data: [],
            series: [
                {
                    data: yAxisDataLikes,
                    label: "Likes",
                    color: "#4caf50",
                    showMark: false,
                },
                {
                    data: yAxisDataDislikes,
                    label: "Dislikes",
                    color: "#af3838",
                    showMark: false,
                },
            ],
        },
        { label: "Total Favorites", data: yAxisDataFavorites, showMark: false },
    ];

    const newestInfo = data[data.length - 1];

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Rampant Rage
                    </Typography>
                    <AdminButton />
                </Toolbar>
            </AppBar>

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
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: "100%",
                        gap: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold">
                        Time Range
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <DateTimePicker
                            label="Start Time"
                            value={dateRangeStart}
                            onChange={(newStart) => {
                                if (!newStart) return;
                                if (newStart.isAfter(dateRangeEnd))
                                    setDateRangeEnd(newStart);
                                setDateRangeStart(newStart);
                            }}
                        />
                        <Typography variant="h4">/</Typography>
                        <DateTimePicker
                            label="End Time"
                            value={dateRangeEnd}
                            onChange={(newEnd) => {
                                if (!newEnd) return;
                                if (newEnd.isBefore(dateRangeStart))
                                    setDateRangeStart(newEnd);
                                setDateRangeEnd(newEnd);
                            }}
                        />
                    </Box>
                </Paper>

                <Box
                    sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 3,
                        width: "100%",
                    }}
                >
                    {Array.from({ length: Math.ceil(charts.length / 2) }).map(
                        (_, colIndex) => (
                            <Box
                                key={colIndex}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 3,
                                    width: { xs: "100%", sm: "45%", lg: "45%" },
                                }}
                            >
                                {charts
                                    .slice(colIndex * 2, colIndex * 2 + 2)
                                    .map((chart, i) => (
                                        <Paper
                                            key={i}
                                            elevation={3}
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                p: 3,
                                                borderRadius: 2,
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                gutterBottom
                                            >
                                                {chart.label}
                                            </Typography>
                                            <Box sx={{ width: "100%", px: 2 }}>
                                                <LineChart
                                                    height={chartHeights}
                                                    xAxis={[
                                                        {
                                                            scaleType: "time",
                                                            data: xAxisData,
                                                            valueFormatter:
                                                                formatDate,
                                                            label: "Date",
                                                        },
                                                    ]}
                                                    series={
                                                        chart.series || [
                                                            {
                                                                data: chart.data,
                                                                label: chart.label,
                                                                showMark:
                                                                    chart.showMark,
                                                            },
                                                        ]
                                                    }
                                                />
                                            </Box>
                                        </Paper>
                                    ))}
                            </Box>
                        ),
                    )}

                    <Paper
                        elevation={0}
                        sx={{
                            width: { xs: "100%", sm: "100%", lg: "100%" },
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            p: 4,
                            borderRadius: 3,
                            backgroundColor: "background.paper",
                            textAlign: "center",
                        }}
                    >
                        <Typography variant="h3" fontWeight="bold" gutterBottom>
                            Realtime stats:
                        </Typography>

                        {realtimeMetrics ? (
                            <>
                                <Typography
                                    variant="h5"
                                    fontWeight="bold"
                                    gutterBottom
                                >
                                    Like to Dislike Ratio
                                </Typography>
                                <Box>
                                    <Typography
                                        variant="h4"
                                        color="primary"
                                        fontWeight={500}
                                    >
                                        {(() => {
                                            const likes =
                                                Number(realtimeMetrics.likes) ||
                                                0;
                                            const dislikes =
                                                Number(
                                                    realtimeMetrics.dislikes,
                                                ) || 0;
                                            const total = likes + dislikes;
                                            return total > 0
                                                ? `${((likes / total) * 100).toFixed(1)}%`
                                                : "0%";
                                        })()}{" "}
                                        of votes are positive!
                                    </Typography>

                                    <Box
                                        mt={2}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        gap={4}
                                    >
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <ThumbUp color="success" />
                                            <Typography variant="body1">
                                                {Number(
                                                    realtimeMetrics.likes,
                                                ) || 0}
                                            </Typography>
                                        </Box>
                                        <Box
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                        >
                                            <ThumbDown color="error" />
                                            <Typography variant="body1">
                                                {Number(
                                                    realtimeMetrics.dislikes,
                                                ) || 0}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box className="flex gap-8">
                                    <Typography variant="h5">
                                        <Box
                                            component="span"
                                            display="inline-flex"
                                            alignItems="center"
                                            gap={0.5}
                                        >
                                            Active:{" "}
                                            {AbbreviateNumber(Number(
                                                realtimeMetrics.active_players,
                                            ) || 0, 2)}{" "}
                                            <AccountCircle />
                                        </Box>
                                    </Typography>

                                    <Typography variant="h5">
                                        <Box
                                            component="span"
                                            display="inline-flex"
                                            alignItems="center"
                                            gap={0.5}
                                        >
                                            Visits:{" "}
                                            {AbbreviateNumber(Number(
                                                realtimeMetrics.visits,
                                            ) || 0, 2)}{" "}
                                            <TrendingUp />
                                        </Box>
                                    </Typography>

                                    <Typography variant="h5">
                                        <Box
                                            component="span"
                                            display="inline-flex"
                                            alignItems="center"
                                            gap={0.5}
                                        >
                                            Favorites:{" "}
                                            {AbbreviateNumber(Number(
                                                realtimeMetrics.favorites,
                                            ) || 0, 2)}{" "}
                                            <Star />
                                        </Box>
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Typography
                                variant="h5"
                                fontWeight="bold"
                                gutterBottom
                            >
                                Loading real time stats
                            </Typography>
                        )}
                    </Paper>
                </Box>
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
