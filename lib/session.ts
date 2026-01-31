export const sessionOptions = {
    password: process.env.NEXT_PRIVATE_SESSION_SECRET as string,
    cookieName: "rr_logs_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};

declare module "iron-session" {
    interface IronSessionData {
        user?: { username: string };
    }
}