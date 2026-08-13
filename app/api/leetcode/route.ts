import { NextResponse } from "next/server";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_USERNAME = "Vs2hmj5a8n";
const CACHE_SECONDS = 60 * 60 * 6;

const USER_PROFILE_CALENDAR_QUERY = `
  query userProfileCalendar($username: String!, $year: Int) {
    matchedUser(username: $username) {
      userCalendar(year: $year) {
        activeYears
        streak
        totalActiveDays
        submissionCalendar
      }
    }
  }
`;

type LeetCodeResponse = {
  data?: {
    matchedUser?: {
      userCalendar?: {
        streak?: number;
        totalActiveDays?: number;
        submissionCalendar?: string;
      } | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

export const revalidate = CACHE_SECONDS;

export async function GET() {
  const year = new Date().getUTCFullYear();

  try {
    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: USER_PROFILE_CALENDAR_QUERY,
        operationName: "userProfileCalendar",
        variables: { username: LEETCODE_USERNAME, year },
      }),
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) throw new Error(`LeetCode returned ${response.status}`);

    const payload = (await response.json()) as LeetCodeResponse;
    const userCalendar = payload.data?.matchedUser?.userCalendar;
    if (!userCalendar || payload.errors?.length) throw new Error("LeetCode calendar unavailable");

    const parsed = JSON.parse(userCalendar.submissionCalendar || "{}") as Record<string, unknown>;
    const calendar = Object.fromEntries(
      Object.entries(parsed)
        .filter(([timestamp, count]) => /^\d+$/.test(timestamp) && Number.isFinite(Number(count)))
        .map(([timestamp, count]) => [timestamp, Math.max(0, Number(count))]),
    );
    const totalSubmissions = Object.values(calendar).reduce((total, count) => total + count, 0);

    return NextResponse.json(
      {
        calendar,
        streak: userCalendar.streak ?? 0,
        totalActiveDays: userCalendar.totalActiveDays ?? 0,
        totalSubmissions,
        year,
      },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400` } },
    );
  } catch (error) {
    console.error("Unable to load LeetCode activity", error);
    return NextResponse.json(
      { error: "LeetCode activity is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
