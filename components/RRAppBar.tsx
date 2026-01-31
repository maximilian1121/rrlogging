import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useIsAuthed } from "@/hooks/Authed";
import { useEventsContext } from "@/contexts/EventsContext";
import { Chip } from "@mui/material";

export default function RRAppBar() {
    const isAuthed = useIsAuthed();
    const { events, isConnected, error, clearEvents } = useEventsContext();

    function WhichChipColour() {
        if (error) return "error";
        if (isConnected) return "success";
        return "warning";
    }

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
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
                </Toolbar>
            </AppBar>
        </Box>
    );
}
