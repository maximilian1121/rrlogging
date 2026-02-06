"use client";

import { IconButton } from "@mui/material";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function RobloxClientComponent({
    username,
}: {
    username: string;
}) {
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch(
                `/api/public/get-roblox-user?username=${encodeURIComponent(username)}`,
            );
            const data = await res.json();
            setUserData(data);
        };
        fetchData();
    }, [username]);

    return (
        <>
            <IconButton href={`https://roblox.com/users/${userData && userData.id}`} target="_blank">
                <Image
                    height={32}
                    width={32}
                    src={userData && userData.profile_url || "/api/public/get-roblox-user/picture/1"}
                    alt=""
                    className="rounded-full"
                />
            </IconButton>
        </>
    );
}
