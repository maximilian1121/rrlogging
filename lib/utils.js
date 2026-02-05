export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === "x" ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const TRUSTED_ATTACHMENTS = [
    "https://cdn.roblox.com",
    "https://files.latific.click",
    "https://latific.click",
    "https://imgur.com",
    "https://i.imgur.com",
    "https://medal.tv",
    "https://gyazo.com",
    "https://i.gyazo.com",
    "https://prnt.sc",
    "https://pasteboard.co",
    "https://pasteboard.io",
    "https://postimages.org",
    "https://postimages.cc",
    "https://snipboard.io",
    "https://imgbox.com",
    "https://tinypic.com",
    "https://ibb.co",
];