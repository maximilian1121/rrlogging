"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useIsAuthed(redirectPath: string = "/login") {
    const router = useRouter();
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/is-authed");
                if (res.status === 401) {
                    setIsAuthed(false);
                    router.push(redirectPath);
                } else {
                    setIsAuthed(true);
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setIsAuthed(false);
                router.push(redirectPath);
            }
        };

        checkAuth();
    }, [router, redirectPath]);

    return isAuthed;
}
