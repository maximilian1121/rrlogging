"use client";

import { Logout } from "@mui/icons-material";
import { TextField, Paper, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/sign-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Something went wrong");
            } else {
                setError(null);
                router.push("/admin");
                setPassword("");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex justify-center items-center">
            <Paper className="p-8 flex flex-col gap-4" elevation={3}>
                <h2 className="text-center text-xl font-semibold">Login</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <TextField
                        type="password"
                        variant="outlined"
                        label={error ? error : "Password"}
                        fullWidth
                        value={password}
                        error={error !== null}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Login"}
                    </Button>
                    <Button
                        onClick={() => {
                            router.push("/");
                        }}
                        variant="outlined"
                        color="primary"
                        endIcon={<Logout />}
                    >
                        Back to home
                    </Button>
                </form>
            </Paper>
        </div>
    );
}
