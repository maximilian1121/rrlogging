import { AppBar, Link, Toolbar, Typography } from "@mui/material";
import AdminButton from "./AdminButton";

export default function PublicAppBar() {
    return (
        <AppBar position="static">
            <Toolbar className="flex gap-4">
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Rampant Rage
                </Typography>
                <Link href="/" color="#fff">
                    Home
                </Link>
                <Link href="/bug-reporting" color="#fff">
                    Report bug
                </Link>
                <Link href="/admin" color="#fff">
                    Admin
                </Link>
            </Toolbar>
        </AppBar>
    );
}
