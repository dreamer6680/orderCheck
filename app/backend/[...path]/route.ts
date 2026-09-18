import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const target = new URL(`/${path.join("/")}`, BACKEND_URL);
  target.search = incomingUrl.search;

  const headers = new Headers();
  for (const headerName of ["authorization", "content-type", "accept"]) {
    const value = request.headers.get(headerName);
    if (value) headers.set(headerName, value);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(target, init);
  const body = response.status === 204 || response.status === 205
    ? null
    : await response.arrayBuffer();

  const responseHeaders = new Headers();
  for (const headerName of ["content-type", "content-length", "location"]) {
    const value = response.headers.get(headerName);
    if (value) responseHeaders.set(headerName, value);
  }

  return new NextResponse(body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
