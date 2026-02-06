"use client";

import { useEventsContext } from "@/contexts/EventsContext";
import { useIsAuthed } from "@/hooks/Authed";
import { Logout } from "@mui/icons-material";
import { Button, Chip } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

export default function RRAppBar() {
    const isAuthed = useIsAuthed();
    const { events, isConnected, error, clearEvents } = useEventsContext();
    const router = useRouter();

    function WhichChipColour() {
        if (error) return "error";
        if (isConnected) return "success";
        return "warning";
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar className="flex gap-4">
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Rampant Rage log viewer
                    </Typography>
                    <Chip
                        color={WhichChipColour()}
                        label={isConnected ? "Real-time" : "No live updates"}
                    />
                    <Button
                        onClick={() => {
                            router.push("/");
                        }}
                        variant="contained"
                        color="secondary"
                        endIcon={<Logout />}
                    >
                        Exit admin
                    </Button>
                </Toolbar>
            </AppBar>
        </Box>
    );
}
