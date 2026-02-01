import { Typography } from "@mui/material";

const DEAD_TIME = 100;

type Props = {
    mostRecentTime: Date;
};

export default function OnlineIndicator({ mostRecentTime }: Props) {
    const now = new Date();
    const diffSeconds = (now.getTime() - mostRecentTime.getTime()) / 1000;

    let likeliness: number;
    if (diffSeconds <= 5) {
        likeliness = 100;
    } else if (diffSeconds >= DEAD_TIME) {
        likeliness = 0;
    } else {
        likeliness = Math.round(((DEAD_TIME - diffSeconds) / (DEAD_TIME - 5)) * 100);
    }

    return <Typography>Online likeliness: {likeliness}%</Typography>;
}
