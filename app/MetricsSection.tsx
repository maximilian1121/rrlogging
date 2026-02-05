"use client";

import { AbbreviateNumber, Metric, RealtimeMetric } from "@/lib/types";
import {
    AccountCircle,
    Star,
    ThumbDown,
    ThumbUp,
    TrendingDown,
    TrendingUp,
} from "@mui/icons-material";
import {
    Box,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
} from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { DateTimePicker, renderTimeViewClock } from "@mui/x-date-pickers";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";

export default function MetricsSection() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Metric[]>([]);
    const [dateRangeStart, setDateRangeStart] = useState<Dayjs>(
        dayjs().subtract(24, "hour"),
    );
    const [dateRangeEnd, setDateRangeEnd] = useState<Dayjs>(dayjs());
    const [dateRangePreset, setDateRangePreset] = useState<number | null>(1);
    const [realtimeMetrics, setRealtimeMetrics] =
        useState<RealtimeMetric | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [zoomRange, setZoomRange] = useState<{
        start: number | null;
        end: number | null;
    }>({
        start: null,
        end: null,
    });

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

    const getTrend = (dataArray: number[], lookback = 5) => {
        if (dataArray.length < 2) return { text: "STABLE", color: "gray" };

        const slice = dataArray.slice(-lookback);
        const first = slice[0];
        const last = slice[slice.length - 1];

        const delta = last - first;

        if (Math.abs(delta) < 0.01 * first) {
            return { text: "STABLE", color: "gray" };
        }

        return delta > 0
            ? { color: "success", icon: <TrendingUp />, text: "Up" }
            : { color: "error", icon: <TrendingDown />, text: "Down" };
    };

    const formatDate = (timestamp: number) =>
        dayjs(timestamp).format("MMM DD, YYYY h:mm A");

    const chartHeights = 300;

    const charts = [
        {
            label: "Active Players",
            data: yAxisDataActive,
            trend: getTrend(yAxisDataActive),
            showMark: false,
        },
        {
            label: "Total Visits",
            data: yAxisDataVisits,
            trend: getTrend(yAxisDataVisits),
            showMark: false,
        },
        {
            label: "Likes to Dislikes",
            data: [],
            trend: getTrend(yAxisDataLikes),
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
        {
            label: "Total Favorites",
            data: yAxisDataFavorites,
            showMark: false,
            trend: getTrend(yAxisDataFavorites),
        },
    ];

    const presets = [
        { label: "1 hour", value: 1 },
        { label: "2 hours", value: 2 },
        { label: "4 hours", value: 4 },
        { label: "8 hours", value: 8 },
        { label: "1 day", value: 24 },
        { label: "2 days", value: 48 },
        { label: "4 days", value: 96 },
        { label: "1 week", value: 168 },
        { label: "1 month", value: 24 * 31 },
        { label: "1 year", value: 24 * 365 },
    ];

    return (
        <>
            <Typography variant="h3" color="textPrimary" fontWeight="bold">
                Metrics
            </Typography>
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
                            setDateRangePreset(null);
                        }}
                        viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                            seconds: null,
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
                            setDateRangePreset(null);
                        }}
                        viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                            seconds: null,
                        }}
                    />
                    <InputLabel id="select-date-range-presets-label">
                        Date range presets
                    </InputLabel>
                    <Select
                        labelId="select-date-range-presets-label"
                        value={dateRangePreset ?? ""}
                        displayEmpty
                        onChange={(event) => {
                            const hours = Number(event.target.value);
                            if (!hours) return;

                            const now = dayjs();

                            setDateRangePreset(hours);
                            setDateRangeEnd(now);
                            setDateRangeStart(now.subtract(hours, "hour"));
                        }}
                        renderValue={(value) => {
                            if (!value) {
                                return (
                                    <Typography color="gray">
                                        Custom range
                                    </Typography>
                                );
                            }

                            const preset = presets.find(
                                (p) => p.value === value,
                            );
                            return preset?.label ?? value;
                        }}
                    >
                        {presets.map((preset) => (
                            <MenuItem key={preset.value} value={preset.value}>
                                {preset.label}
                            </MenuItem>
                        ))}
                    </Select>
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
                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight: "bold",
                                                mb: 2,
                                            }}
                                            color={chart.trend.color}
                                        >
                                            Current trend: {chart.trend.text}{" "}
                                            {chart.trend.icon}
                                        </Typography>
                                        <Box sx={{ width: "100%", px: 2 }}>
                                            <LineChart
                                                height={chartHeights}
                                                axisHighlight={{ x: "line", y: "line" }}
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
                                                zoomAndPan="x"
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
                                            Number(realtimeMetrics.likes) || 0;
                                        const dislikes =
                                            Number(realtimeMetrics.dislikes) ||
                                            0;
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
                                            {Number(realtimeMetrics.likes) || 0}
                                        </Typography>
                                    </Box>
                                    <Box
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                    >
                                        <ThumbDown color="error" />
                                        <Typography variant="body1">
                                            {Number(realtimeMetrics.dislikes) ||
                                                0}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <br />
                            <Box className="flex gap-8">
                                <Typography variant="h5">
                                    <Box
                                        component="span"
                                        display="inline-flex"
                                        alignItems="center"
                                        gap={0.5}
                                    >
                                        Active:{" "}
                                        {AbbreviateNumber(
                                            Number(
                                                realtimeMetrics.active_players,
                                            ) || 0,
                                            2,
                                        )}{" "}
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
                                        {AbbreviateNumber(
                                            Number(realtimeMetrics.visits) || 0,
                                            2,
                                        )}{" "}
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
                                        {AbbreviateNumber(
                                            Number(realtimeMetrics.favorites) ||
                                                0,
                                            2,
                                        )}{" "}
                                        <Star />
                                    </Box>
                                </Typography>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Loading real time stats
                        </Typography>
                    )}
                </Paper>
            </Box>
        </>
    );
}
