"use client";

import { copyTextToClipboard, getFileType } from "@/lib/utils";
import { Close } from "@mui/icons-material";
import { SiImgur } from "react-icons/si";
import {
    AppBar,
    Box,
    Dialog,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    MenuItem,
    Pagination,
    Paper,
    Select,
    TextField,
    Toolbar,
    Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { FaDiscord, FaYoutube } from "react-icons/fa";
import { AttachmentRenderer } from "./attatchment-render";
import RobloxUserDisplay from "./roblox-user-link";
import GetIconForUrl from "./get-icon-for-url";

type BugReport = {
    id: number;
    contact_methods: {
        discord: string | null;
        roblox: string | null;
    };
    created_at: string;
    description: string;
    attachments: string[];
};

export default function BugReports() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BugReport[] | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [selectedLimit, setSelectedLimit] = useState(50);
    const [bugReportSelected, setBugReportSelected] =
        useState<null | BugReport>(null);

    const { enqueueSnackbar } = useSnackbar();

    const search = async (query: string, pageNum = 1) => {
        setLoading(true);
        const offset = (pageNum - 1) * selectedLimit;
        let url = `/api/search/bug-reports?search=${encodeURIComponent(query)}&offset=${offset}&limit=${selectedLimit}`;

        try {
            const res = await fetch(url);
            const result = await res.json();
            setData(result.rows);
            setPages(result.pages);
            setPage(result.page);
        } catch (err) {
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            search(searchQuery, page);
        }, 200);
        return () => clearTimeout(searchTimeout);
    }, [searchQuery, selectedLimit, page]);

    return (
        <>
            <Dialog fullScreen open={bugReportSelected !== null}>
                {bugReportSelected !== null &&
                    (() => {
                        // Logic to separate media from plain links
                        const mediaTypes = [
                            "image",
                            "video",
                            "pdf",
                            "youtube",
                            "embed",
                        ];
                        const mediaItems = bugReportSelected.attachments.filter(
                            (u) => mediaTypes.includes(getFileType(u)),
                        );
                        const linkItems = bugReportSelected.attachments.filter(
                            (u) => !mediaTypes.includes(getFileType(u)),
                        );

                        return (
                            <>
                                <AppBar sx={{ position: "relative" }}>
                                    <Toolbar>
                                        <IconButton
                                            edge="start"
                                            color="inherit"
                                            onClick={() =>
                                                setBugReportSelected(null)
                                            }
                                        >
                                            <Close />
                                        </IconButton>
                                        <Typography
                                            sx={{ ml: 2, flex: 1 }}
                                            variant="h6"
                                        >
                                            Bug report #{bugReportSelected.id}
                                        </Typography>
                                    </Toolbar>
                                </AppBar>

                                <Box className="p-6 max-w-7xl mx-auto w-full">
                                    <Typography variant="h5" gutterBottom>
                                        Report Details
                                    </Typography>
                                    <Paper
                                        variant="outlined"
                                        className="p-4 mb-6"
                                    >
                                        <Typography
                                            variant="body1"
                                            className="whitespace-pre-wrap"
                                        >
                                            {bugReportSelected.description}
                                        </Typography>
                                    </Paper>

                                    {mediaItems.length > 0 && (
                                        <Box className="mb-8">
                                            <Typography
                                                variant="overline"
                                                color="textSecondary"
                                                className="font-bold"
                                            >
                                                Media Attachments
                                            </Typography>
                                            <Grid
                                                container
                                                spacing={2}
                                                className="mt-1"
                                            >
                                                {mediaItems.map((url, idx) => (
                                                    <Grid
                                                        item
                                                        xs={12}
                                                        md={6}
                                                        key={idx}
                                                    >
                                                        <AttachmentRenderer
                                                            url={url}
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    )}

                                    {linkItems.length > 0 && (
                                        <Box>
                                            <Typography
                                                variant="overline"
                                                color="textSecondary"
                                                className="font-bold"
                                            >
                                                Other Links
                                            </Typography>
                                            <Paper
                                                variant="outlined"
                                                className="mt-1"
                                            >
                                                <List dense>
                                                    {linkItems.map(
                                                        (url, idx) => (
                                                            <ListItem
                                                                key={idx}
                                                                divider={
                                                                    idx !==
                                                                    linkItems.length -
                                                                        1
                                                                }
                                                            >
                                                                <GetIconForUrl url={url}/>
                                                                <AttachmentRenderer
                                                                    url={url}
                                                                />
                                                            </ListItem>
                                                        ),
                                                    )}
                                                </List>
                                            </Paper>
                                        </Box>
                                    )}
                                </Box>
                            </>
                        );
                    })()}
            </Dialog>

            <div className="max-w-6xl mx-auto m-8 gap-4 flex h-full">
                <Paper className="py-4 flex flex-col gap-2 h-fit select-none px-4 w-[25%] min-w-[25%]">
                    <Typography variant="h6">Filter search</Typography>
                    <Divider />
                    <Typography variant="body2">Reports per page</Typography>
                    <Select
                        size="small"
                        value={selectedLimit}
                        onChange={(e) =>
                            setSelectedLimit(Number(e.target.value))
                        }
                    >
                        {[25, 50, 100, 200].map((num) => (
                            <MenuItem key={num} value={num}>
                                {num}
                            </MenuItem>
                        ))}
                    </Select>
                </Paper>

                <div className="flex flex-col gap-4 w-[75%]">
                    <TextField
                        fullWidth
                        label="Search Reports"
                        variant="outlined"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />

                    <Paper className="p-4 flex flex-col gap-4 min-h-100">
                        {loading ? (
                            <Typography>Loading...</Typography>
                        ) : data && data.length > 0 ? (
                            <>
                                <Box className="flex justify-center">
                                    <Pagination
                                        count={pages}
                                        page={page}
                                        onChange={(_, v) => setPage(v)}
                                        color="primary"
                                    />
                                </Box>
                                <Divider />
                                {data.map((item) => (
                                    <Box
                                        key={item.id}
                                        className="p-2 cursor-pointer"
                                        onClick={() =>
                                            setBugReportSelected(item)
                                        }
                                    >
                                        <Box className="flex gap-2 items-center">
                                            {item.contact_methods.roblox && (
                                                <RobloxUserDisplay
                                                    username={
                                                        item.contact_methods
                                                            .roblox
                                                    }
                                                />
                                            )}
                                            {item.contact_methods.discord && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyTextToClipboard(
                                                            item.contact_methods
                                                                .discord!,
                                                        );
                                                        enqueueSnackbar(
                                                            "Discord username copied!",
                                                        );
                                                    }}
                                                >
                                                    <FaDiscord />
                                                </IconButton>
                                            )}
                                            <Typography
                                                variant="body2"
                                                className="truncate flex-1"
                                            >
                                                {item.description}
                                            </Typography>
                                        </Box>
                                        <Divider />
                                    </Box>
                                ))}
                            </>
                        ) : (
                            <Typography>No results found.</Typography>
                        )}
                    </Paper>
                </div>
            </div>
        </>
    );
}
