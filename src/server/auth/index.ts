import NextAuth from "next-auth";
import { authConfig } from "./config";

// Jalankan NextAuth dengan config lo
const handler = NextAuth(authConfig);

// Ekspor GET dan POST dari handler, jangan destructure!
export const GET = handler.GET;
export const POST = handler.POST;
