export function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export const TRUSTED_ATTACHMENTS = [
    "cdn.roblox.com",
    "files.latific.click",
    "latific.click",
    "imgur.com",
    "i.imgur.com",
    "medal.tv",
    "gyazo.com",
    "i.gyazo.com",
    "prnt.sc",
    "pasteboard.co",
    "pasteboard.io",
    "postimages.org",
    "postimages.cc",
    "snipboard.io",
    "imgbox.com",
    "tinypic.com",
    "ibb.co",
    "youtube.com",
    "www.youtube.com",
    "youtu.be"
];

export const isTrusted = (userInput: string) => {
    try {
        const url = new URL(userInput);
        return TRUSTED_ATTACHMENTS.includes(url.hostname);
    } catch (e) {
        return false;
    }
};

export function fallbackCopyTextToClipboard(text: string) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand("copy");
        var msg = successful ? "successful" : "unsuccessful";
        console.log("Fallback: Copying text command was " + msg);
    } catch (err) {
        console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
}
export function copyTextToClipboard(text: string) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(
        function () {
            console.log("Async: Copying to clipboard was successful!");
        },
        function (err) {
            console.error("Async: Could not copy text: ", err);
        },
    );
}

export function getFileType(url: string) {
    const clean = url.split("?")[0].toLowerCase();

    if (clean.match(/\.(png|jpg|jpeg|gif|webp|avif)$/)) return "image";
    if (clean.match(/\.(mp4|webm|ogg|mov)$/)) return "video";
    if (clean.endsWith(".pdf")) return "pdf";

    if (
        false
    ) {
        return "embed"; 
    }

    return "link";
}