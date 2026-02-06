"use client";

import PublicAppBar from "@/components/PublicAppBar";
import { isTrusted } from "@/lib/utils";
import { AccountCircle, Add, Remove, Warning } from "@mui/icons-material";
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Link,
    List,
    Paper,
    TextareaAutosize,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function BugReporting() {
    const [contactMethods, setContactMethods] = useState({
        discord: { active: false, value: "" },
        roblox: { active: false, value: "" },
    });
    const [robloxUserExists, setRobloxUserExists] = useState(false);
    const [robloxUserPFPUrl, setRobloxUserPFPUrl] = useState<string | null>(
        null,
    );
    const [attachmentsList, setAttachmentsList] = useState<string[]>([]);
    const [bugDescription, setBugDescription] = useState("");
    const [attachmentInput, setAttachmentInput] = useState("");
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState("");
    const [alertBody, setAlertBody] = useState("");
    const router = useRouter();

    const handleAddAttachment = () => {
        if (!attachmentInput.trim()) return;
        setAttachmentsList((prev) => [...prev, attachmentInput.trim()]);
        setAttachmentInput("");
    };

    const handleRemoveAttachment = (index: number) => {
        setAttachmentsList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCheckChange = (method: keyof typeof contactMethods) => {
        setContactMethods((prev) => ({
            ...prev,
            [method]: { ...prev[method], active: !prev[method].active },
        }));
    };

    const handleValueChange = (
        method: keyof typeof contactMethods,
        val: string,
    ) => {
        setContactMethods((prev) => ({
            ...prev,
            [method]: { ...prev[method], value: val },
        }));
    };

    const updateRobloxInfo = async () => {
        const roblox_user_info = await fetch(
            `/api/public/get-roblox-user?username=${contactMethods.roblox.value}`,
        );

        if (roblox_user_info.ok) {
            setRobloxUserExists(true);
            const pfpUrl = (await roblox_user_info.json()).profile_url;
            const pfpExists = await fetch(pfpUrl);
            if (pfpExists.ok) {
                setRobloxUserPFPUrl(pfpUrl);
            } else {
                setRobloxUserPFPUrl(null);
            }
        } else {
            setRobloxUserExists(false);
            setRobloxUserPFPUrl(null);
        }
    };

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (
            !contactMethods.roblox.active ||
            !contactMethods.roblox.value.trim()
        ) {
            setRobloxUserExists(false);
            setRobloxUserPFPUrl(null);
            return;
        }

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        debounceTimer.current = setTimeout(() => {
            updateRobloxInfo();
        }, 500);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [contactMethods.roblox.value, contactMethods.roblox.active]);

    const minChars = 100;

    const isFormValid =
        Object.values(contactMethods).some(
            (m) => m.active && m.value.trim() !== "",
        ) &&
        bugDescription.trim().length >= minChars &&
        robloxUserExists;

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const contact_info = Object.entries(contactMethods)
            .filter(([_, data]) => data.active)
            .reduce((acc, [key, data]) => ({ ...acc, [key]: data.value }), {});

        const requestBody = {
            contact_info,
            description: bugDescription,
            attachments: attachmentsList,
            page: window.location.href,
        };

        setSubmitting(true);

        try {
            const response = await fetch("/api/public/report-bug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                setAlertOpen(true);
                setAlertTitle("Error submitting bug!");
                setAlertBody(
                    `Server responded with code ${response.status}: ${response.statusText}`,
                );
                return;
            }

            const data = await response.json();
            console.log("Bug report submitted successfully:", data);

            setAlertOpen(true);
            setAlertTitle("Successfully submitted bug report!");
            setAlertBody(
                `The devs might get back to you sooner or later. This feedback is greatly appreciated!`,
            );

            setContactMethods({
                discord: { active: false, value: "" },
                roblox: { active: false, value: "" },
            });
            setBugDescription("");
            setAttachmentsList([]);
            setAttachmentInput("");
            setRobloxUserExists(false);
            setRobloxUserPFPUrl(null);
        } catch (error) {
            setAlertOpen(true);
            setAlertTitle("Error submitting bug!");
            setAlertBody(`Failed to send bug report on the client!`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PublicAppBar />
            <Dialog
                open={alertOpen}
                onClose={() => {
                    setAlertOpen(false);
                }}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{alertTitle}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {alertBody}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            router.push("/");
                        }}
                    >
                        Home
                    </Button>
                    <Button
                        onClick={() => {
                            setAlertOpen(false);
                        }}
                        autoFocus
                    >
                        Submit another
                    </Button>
                </DialogActions>
            </Dialog>
            <Box
                component="main"
                sx={{
                    maxWidth: "800px",
                    mx: "auto",
                    mt: 4,
                    mb: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    alignItems: "center",
                }}
            >
                <Typography variant="h3" fontWeight="bold">
                    Report a bug
                </Typography>

                <Box
                    component="form"
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        width: "100%",
                    }}
                    onSubmit={handleSubmit}
                >
                    <Paper
                        sx={{
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Typography variant="h5">
                            How can we contact you?
                        </Typography>
                        <Typography variant="caption" color="error">
                            * Please select and fill out at least one method.
                            This is to minimize bots!
                        </Typography>

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={contactMethods.discord.active}
                                    onChange={() =>
                                        handleCheckChange("discord")
                                    }
                                />
                            }
                            label="Discord - preferred"
                        />
                        {contactMethods.discord.active && (
                            <TextField
                                label="Discord Username"
                                fullWidth
                                value={contactMethods.discord.value}
                                onChange={(e) =>
                                    handleValueChange("discord", e.target.value)
                                }
                            />
                        )}

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={contactMethods.roblox.active}
                                    onChange={() => handleCheckChange("roblox")}
                                />
                            }
                            label="Roblox"
                        />
                        {contactMethods.roblox.active && (
                            <TextField
                                label="Roblox Username"
                                fullWidth
                                value={contactMethods.roblox.value}
                                onChange={(e) =>
                                    handleValueChange("roblox", e.target.value)
                                }
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {robloxUserPFPUrl &&
                                                robloxUserExists ? (
                                                    <Image
                                                        src={robloxUserPFPUrl}
                                                        className="h-6 w-6 rounded-full object-cover"
                                                        alt="Roblox Avatar"
                                                        width={6}
                                                        height={6}
                                                    />
                                                ) : (
                                                    <AccountCircle />
                                                )}
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        )}
                    </Paper>

                    <Paper
                        sx={{
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Typography variant="h5">Describe the bug.</Typography>
                        {bugDescription.trim().length < minChars && (
                            <Typography variant="caption" color="error">
                                * Please enter at least {minChars} characters!
                            </Typography>
                        )}
                        <TextareaAutosize
                            value={bugDescription}
                            onChange={(e) => setBugDescription(e.target.value)}
                            className="focus:outline-none focus:ring-2 focus:ring-blue-500 p-2 border border-gray-300 rounded"
                            minRows={5}
                            placeholder="Please be descriptive..."
                        />
                    </Paper>

                    <Paper
                        sx={{
                            p: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Typography variant="h5">
                            Any attachments to include?
                        </Typography>

                        <Box className="flex gap-4 justify-center items-center w-full">
                            <TextField
                                label="Attachment URL"
                                fullWidth
                                type="url"
                                value={attachmentInput}
                                onChange={(e) =>
                                    setAttachmentInput(e.target.value)
                                }
                            />
                            <IconButton
                                onClick={handleAddAttachment}
                                color="primary"
                                aria-label="Add attachment"
                            >
                                <Add />
                            </IconButton>
                        </Box>

                        <List>
                            {attachmentsList.length > 0 ? (
                                attachmentsList.map((attachment, idx) => {
                                    const trusted = isTrusted(attachment);

                                    return (
                                        <Box
                                            key={idx}
                                            className="flex justify-between items-center gap-2 py-1"
                                        >
                                            <Box className="flex items-center gap-1">
                                                <Link
                                                    href={attachment}
                                                    target="_blank"
                                                    rel="noopener"
                                                >
                                                    {attachment}
                                                </Link>
                                                {!trusted && (
                                                    <Tooltip title="Admins will get a warning when viewing this attachment! This is to mitigate ip pulling!">
                                                        <Typography
                                                            variant="caption"
                                                            color="grey"
                                                            className="italic"
                                                        >
                                                            untrusted!{" "}
                                                            <Warning />
                                                        </Typography>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                            <IconButton
                                                onClick={() =>
                                                    handleRemoveAttachment(idx)
                                                }
                                                color="error"
                                                aria-label="Remove attachment"
                                            >
                                                <Remove />
                                            </IconButton>
                                        </Box>
                                    );
                                })
                            ) : (
                                <Typography
                                    variant="body1"
                                    className="py-2 text-center text-gray-500"
                                >
                                    No attachments added!
                                </Typography>
                            )}
                        </List>
                    </Paper>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={!isFormValid}
                    >
                        Submit Report
                    </Button>
                </Box>
            </Box>
        </>
    );
}
