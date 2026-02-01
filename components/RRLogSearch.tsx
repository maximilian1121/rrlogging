"use client";

import HtmlTooltip from "@/components/HtmlTooltip";
import { useIsAuthed } from "@/hooks/Authed";
import { Log } from "@/lib/types";
import {
    Computer,
    Dns,
    Error,
    Info,
    More,
    MoreHoriz,
    MoreVert,
    Warning,
} from "@mui/icons-material";
import {
    Box,
    Checkbox,
    Divider,
    FormControlLabel,
    IconButton,
    Menu,
    MenuItem,
    MenuList,
    Pagination,
    Paper,
    Select,
    Skeleton,
    TextField,
    Typography,
} from "@mui/material";
import { green } from "@mui/material/colors";
import { useSnackbar } from "notistack";
import { Fragment, useEffect, useState } from "react";

type RRLogSearchProps = {
    onSelectJobId: (jobId: string) => void;
};

export default function RRLogSearch({ onSelectJobId }: RRLogSearchProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<Log[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);
    const [checkBox1, setCheckBox1] = useState(false);
    const [checkBox2, setCheckBox2] = useState(true);
    const [checkBox3, setCheckBox3] = useState(true);
    const [serverEnvironment, setServerEnvironment] = useState(false);
    const [clientEnvironment, setClientEnvironment] = useState(false);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [selectedLimit, setSelectedLimit] = useState(50);

    const { enqueueSnackbar } = useSnackbar();

    useIsAuthed("/login");

    const handleCheckboxChange = (boxNumber: 1 | 2 | 3) => {
        if (boxNumber === 1) setCheckBox1(!checkBox1);
        if (boxNumber === 2) setCheckBox2(!checkBox2);
        if (boxNumber === 3) setCheckBox3(!checkBox3);
    };

    const search = async (query: string, pageNum = 1) => {
        setLoading(true);

        const offset = (pageNum - 1) * selectedLimit;

        let url = `/api/search/messages?search=${encodeURIComponent(
            query,
        )}&offset=${offset}&limit=${selectedLimit}`;

        if (checkBox1 || checkBox2 || checkBox3) {
            const levels = [];
            if (checkBox1) levels.push("1");
            if (checkBox2) levels.push("2");
            if (checkBox3) levels.push("3");
            url += `&levels=${levels.join(",")}`;
        }

        if (serverEnvironment || clientEnvironment) {
            const envs = [];
            if (serverEnvironment) envs.push("Server");
            if (clientEnvironment) envs.push("Client");
            url += `&environments=${envs.join(",")}`;
        }

        try {
            const res = await fetch(url);
            const result = await res.json();

            setData(result.rows);
            setPages(result.pages);
            setPage(result.page);
        } catch (err) {
            enqueueSnackbar("Search failed!", { variant: "error" });
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
        selectedLimit,
    ]);

    return (
        <div className="w-full flex gap-4 max-w-8xl">
            <Paper className="py-4 flex flex-col gap-2 h-fit select-none px-4 w-[25%] min-w-[25%]">
                <Typography variant="h6">Filter search</Typography>

                <Divider />

                <Typography variant="subtitle1">Log levels</Typography>

                <Box className="flex flex-col">
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
                </Box>

                <Divider />

                <Typography variant="subtitle1">Log environments</Typography>

                <Box className="flex flex-col">
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
                </Box>

                <Divider />

                <Typography>Logs per page</Typography>

                <Select
                    value={selectedLimit}
                    onChange={(e) => setSelectedLimit(e.target.value)}
                >
                    {[25, 50, 75, 100, 125, 150, 175, 200].map((num) => (
                        <MenuItem key={num} value={num}>
                            {num}
                        </MenuItem>
                    ))}
                </Select>
            </Paper>

            <div className="flex flex-col gap-4 w-[75%] h-full">
                <Paper className="flex flex-col w-full">
                    <TextField
                        variant="outlined"
                        label="Search"
                        type="search"
                        className="w-full"
                        spellCheck
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") search(searchQuery);
                        }}
                    />
                </Paper>

                <Paper className="h-full w-full p-4 flex flex-col gap-4 max-h-full overflow-auto">
                    <Box className="flex justify-center items-center mt-2">
                        <Pagination
                            count={pages}
                            variant="outlined"
                            color="primary"
                            page={page}
                            onChange={(e, v) => {
                                search(searchQuery, v);
                            }}
                        />
                    </Box>
                    <div>
                        {loading ? (
                            <Box className="flex flex-col gap-2">
                                {[...Array(50)].map((_, i) => (
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
                                className="italic text-center py-4"
                            >
                                No results found!
                            </Typography>
                        ) : (
                            data?.map((item: any, index: number) => (
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
                                                    switch (item.environment) {
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
                                                })()}
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

                                            {item.userid && (
                                                <Typography>
                                                    Affected player:{" "}
                                                    {item.userid}
                                                </Typography>
                                            )}

                                            <Typography className="italic opacity-75">
                                                Roblox JobId: {item.server_id}
                                            </Typography>
                                        </Fragment>
                                    }
                                    followCursor
                                >
                                    <div key={item.id || index}>
                                        <Divider />
                                        <div className="flex items-center my-1 gap-1 cursor-pointer">
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
                                                className="flex-1"
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

                                            <IconButton
                                                onClick={() => {
                                                    onSelectJobId(
                                                        item.server_id,
                                                    );
                                                }}
                                                className="ml-auto"
                                            >
                                                <MoreVert />
                                            </IconButton>
                                        </div>
                                    </div>
                                </HtmlTooltip>
                            ))
                        )}
                        <Divider />
                        <Box className="flex justify-center items-center mt-2">
                            <Pagination
                                count={pages}
                                variant="outlined"
                                color="primary"
                                page={page}
                                onChange={(e, v) => {
                                    search(searchQuery, v);
                                }}
                            />
                        </Box>
                    </div>
                </Paper>
            </div>
        </div>
    );
}
