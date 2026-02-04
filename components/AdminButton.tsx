"use client"

import { AccountCircle } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function AdminButton() {
    const router = useRouter()
    return (
        <Button
            onClick={() => {
                router.push('/admin')
            }}
            variant="contained"
            color="secondary"
            endIcon={<AccountCircle />}
        >
            Admin
        </Button>
    );
}
