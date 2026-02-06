import { isTrusted } from "@/lib/utils";
import { Verified } from "@mui/icons-material";
import { FaYoutube } from "react-icons/fa";
import { SiImgur, SiX } from "react-icons/si";

type Props = {
    url: string;
};

export default function GetIconForUrl({ url }: Props) {
    try {
        if (!url) return null;

        const { hostname } = new URL(url);

        if (hostname === "youtu.be" || hostname.endsWith(".youtube.com")) {
            return <FaYoutube className="mr-2" />;
        }

        if (hostname === "imgur.com" || hostname.endsWith(".imgur.com")) {
            return <SiImgur className="mr-2" />;
        }

        if (hostname === "x.com" || hostname.endsWith(".x.com")) {
            return <SiX className="mr-2" />;
        }

        if (isTrusted(url)) {
            return <Verified className="mr-2" />;
        }
    } catch (e) {
        console.error("Invalid URL provided", e);
    }

    return null;
}
