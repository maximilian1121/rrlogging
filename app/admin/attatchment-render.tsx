import { getFileType, isTrusted } from "@/lib/utils";
import { Warning } from "@mui/icons-material";
import { Box, Button, Link, Paper, Typography } from "@mui/material";
import Image from "next/image";
import { useState } from "react";

export function AttachmentRenderer({ url }: { url: string }) {
    const trusted = isTrusted(url);
    const [revealed, setRevealed] = useState(trusted);
    const type = getFileType(url);

    if (!revealed) {
        return (
            <Paper
                variant="outlined"
                className="w-full p-3 flex flex-col gap-2 bg-yellow-50 border-yellow-200"
            >
                <Typography color="warning.main" fontWeight={600} variant="body2" className="flex items-center gap-1">
                    <Warning fontSize="small" /> Untrusted attachment
                </Typography>

                <Typography variant="caption" className="break-all opacity-80">
                    {url}
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                    Check for IP pullers before revealing.
                </Typography>

                <Box className="flex gap-2 mt-1">
                    <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => setRevealed(true)}
                    >
                        Reveal
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        component="a"
                        target="_blank"
                        href={`https://google.com/search?q=is+this+url+safe+${encodeURIComponent(url)}`}
                    >
                        Check Safety
                    </Button>
                </Box>
            </Paper>
        );
    }

    switch (type) {
        case "image":
            return (
                <Box className="max-w-full">
                    <img
                        src={url}
                        alt="attachment"
                        className="rounded max-w-1/2 h-auto"
                    />
                </Box>
            );

        case "video":
            return (
                <video
                    src={url}
                    controls
                    className="max-w-full max-h-[70vh] rounded border"
                />
            );

        case "pdf":
            return (
                <iframe src={url} className="w-full h-[70vh] rounded border" title="PDF Viewer" />
            );

        default:
            return (
                <Link
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all underline decoration-dotted"
                >
                    {url}
                </Link>
            );
    }
}