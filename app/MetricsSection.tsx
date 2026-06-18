"use client";

import { AbbreviateNumber, Metric, RealtimeMetric } from "@/lib/types";

import {
    TrendingDown,
    TrendingUp,
} from "@mui/icons-material";

import {
    Box,
    MenuItem,
    Paper,
    Select,
    Typography,
} from "@mui/material";

import { LineChart } from "@mui/x-charts";
import { DateTimePicker, renderTimeViewClock } from "@mui/x-date-pickers";

import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";

interface ChartDataResponse {
    bucket: string;
    points: number;
    data: Metric[];
}

export default function MetricsSection() {
    // Removed unused 'loading' state assignment variable
    const [, setLoading] = useState(true);
    const [data, setData] = useState<Metric[]>([]);
    const [dateRangePreset, setDateRangePreset] = useState<number | null>(24);
    const [realtimeMetrics, setRealtimeMetrics] =
        useState<RealtimeMetric | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [dateRangeStart, setDateRangeStart] = useState<Dayjs>(
        dayjs().subtract(24, "hour"),
    );

    const [dateRangeEnd, setDateRangeEnd] = useState<Dayjs>(dayjs());

    // SSE
    useEffect(() => {
        const connect = () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const es = new EventSource("/api/public/realtime-metrics");
            eventSourceRef.current = es;

            es.addEventListener("realtime-metrics", (event) => {
                try {
                    setRealtimeMetrics(JSON.parse(event.data));
                } catch (err) {
                    console.error("SSE parse error:", err);
                }
            });

            es.onerror = () => {
                es.close();

                if (retryTimeoutRef.current) {
                    clearTimeout(retryTimeoutRef.current);
                }

                retryTimeoutRef.current = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, []);

    // fetch chart data
    useEffect(() => {
        setLoading(true);

        const url = `/api/public/get-chart-data?dateRange=${dateRangeStart.toISOString()}_${dateRangeEnd.toISOString()}`;

        fetch(url)
            .then((res) => res.json())
            .then((resData: ChartDataResponse) => {
                setData(resData.data || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [dateRangeStart, dateRangeEnd]);

    // normalize once - explicitly typing 'item' as Metric fixes both TS errors
    const normalizedData = useMemo(() => {
        return data.map((item: Metric) => ({
            ...item,
            ts: dayjs(item.bucket).valueOf(),
        }));
    }, [data]);

    // sort timeline safely
    const sortedData = useMemo(() => {
        return [...normalizedData].sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
    }, [normalizedData]);

    // axis data
    const xAxisData = useMemo(
        () => sortedData.map((i) => i.ts ?? 0),
        [sortedData],
    );

    const yAxisDataActive = useMemo(
        () => sortedData.map((i) => Number(i.active) || 0),
        [sortedData],
    );

    const yAxisDataVisits = useMemo(
        () => sortedData.map((i) => Number(i.visits) || 0),
        [sortedData],
    );

    const yAxisDataLikes = useMemo(
        () => sortedData.map((i) => Number(i.likes) || 0),
        [sortedData],
    );

    const yAxisDataDislikes = useMemo(
        () => sortedData.map((i) => Number(i.dislikes) || 0),
        [sortedData],
    );

    const yAxisDataFavorites = useMemo(
        () => sortedData.map((i) => Number(i.favorites) || 0),
        [sortedData],
    );

    const getTrend = (arr: number[], lookback = 5) => {
        if (arr.length < 2) return { text: "STABLE", color: "gray", icon: null };

        const slice = arr.slice(-lookback);
        const first = slice[0];
        const last = slice[slice.length - 1];

        const delta = last - first;

        if (!first || Math.abs(delta) < 0.01 * Math.max(1, Math.abs(first))) {
            return { text: "STABLE", color: "gray", icon: null };
        }

        return delta > 0
            ? { text: "Up", color: "success", icon: <TrendingUp /> }
            : { text: "Down", color: "error", icon: <TrendingDown /> };
    };

    const formatDate = (t: number) => dayjs(t).format("MMM DD, YYYY h:mm A");

    const chartHeight = 300;

    const charts = [
        {
            label: "Active Players",
            data: yAxisDataActive,
            trend: getTrend(yAxisDataActive),
        },
        {
            label: "Total Visits",
            data: yAxisDataVisits,
            trend: getTrend(yAxisDataVisits),
        },
        {
            label: "Likes vs Dislikes",
            series: [
                { data: yAxisDataLikes, label: "Likes" },
                { data: yAxisDataDislikes, label: "Dislikes" },
            ],
            trend: getTrend(yAxisDataLikes),
        },
        {
            label: "Favorites",
            data: yAxisDataFavorites,
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
            <Typography variant="h3" fontWeight="bold">
                Metrics
            </Typography>

            <Paper sx={{ p: 3, mb: 2 }}>
                <Typography variant="h5">Time Range</Typography>

                <Box display="flex" gap={2} flexWrap="wrap">
                    <DateTimePicker
                        label="Start"
                        value={dateRangeStart}
                        onChange={(v) => {
                            if (!v) return;
                            setDateRangeStart(v);
                            setDateRangePreset(null);
                        }}
                        viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                        }}
                    />

                    <DateTimePicker
                        label="End"
                        value={dateRangeEnd}
                        onChange={(v) => {
                            if (!v) return;
                            setDateRangeEnd(v);
                            setDateRangePreset(null);
                        }}
                        viewRenderers={{
                            hours: renderTimeViewClock,
                            minutes: renderTimeViewClock,
                        }}
                    />

                    <Select
                        value={dateRangePreset ?? ""}
                        onChange={(e) => {
                            const hours = Number(e.target.value);
                            const now = dayjs();

                            setDateRangePreset(hours);
                            setDateRangeEnd(now);
                            setDateRangeStart(now.subtract(hours, "hour"));
                        }}
                        displayEmpty
                    >
                        <MenuItem value="">Custom</MenuItem>
                        {presets.map((p) => (
                            <MenuItem key={p.value} value={p.value}>
                                {p.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            </Paper>

            <Box display="flex" flexWrap="wrap" gap={3}>
                {charts.map((chart, i) => (
                    <Paper key={i} sx={{ p: 2, width: "45%" }}>
                        <Typography fontWeight="bold">{chart.label}</Typography>

                        <Typography color={chart.trend.color}>
                            {chart.trend.text} {chart.trend.icon}
                        </Typography>

                        <LineChart
                            height={chartHeight}
                            xAxis={[
                                {
                                    scaleType: "time",
                                    data: xAxisData,
                                    valueFormatter: formatDate,
                                },
                            ]}
                            series={
                                chart.series ?? [
                                    { data: chart.data, label: chart.label },
                                ]
                            }
                            zoomAndPan="x"
                        />
                    </Paper>
                ))}
            </Box>

            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h4">Realtime</Typography>

                {realtimeMetrics ? (
                    <Box>
                        <Typography>
                            Likes: {realtimeMetrics.likes} / Dislikes:{" "}
                            {realtimeMetrics.dislikes}
                        </Typography>

                        <Typography>
                            Active:{" "}
                            {AbbreviateNumber(
                                Number(realtimeMetrics.active_players) || 0,
                                2,
                            )}
                        </Typography>
                    </Box>
                ) : (
                    <Typography>Loading...</Typography>
                )}
            </Paper>
        </>
    );
}