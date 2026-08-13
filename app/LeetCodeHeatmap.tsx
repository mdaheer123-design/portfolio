"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

type LeetCodeActivity = {
  calendar: Record<string, number>;
  streak: number;
  totalActiveDays: number;
  totalSubmissions: number;
  year: number;
};

type Day = { date: Date; dateLabel: string; timestamp: string; count: number; level: number };

function activityLevel(count: number, maximum: number) {
  if (!count) return 0;
  if (maximum <= 1) return 4;
  return Math.max(1, Math.min(4, Math.ceil((count / maximum) * 4)));
}

function buildDays(year: number, calendar: Record<string, number>): Day[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  const maximum = Math.max(0, ...Object.values(calendar));
  const days: Day[] = [];

  for (let date = start; date < end; date = new Date(date.getTime() + 86_400_000)) {
    const timestamp = String(Math.floor(date.getTime() / 1000));
    const count = calendar[timestamp] ?? 0;
    days.push({
      date,
      timestamp,
      count,
      level: activityLevel(count, maximum),
      dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }),
    });
  }
  return days;
}

async function requestActivity() {
  const response = await fetch("/api/leetcode");
  if (!response.ok) throw new Error("Unable to load activity");
  return response.json() as Promise<LeetCodeActivity>;
}

export function LeetCodeHeatmap() {
  const [activity, setActivity] = useState<LeetCodeActivity | null>(null);
  const [error, setError] = useState(false);

  async function loadActivity() {
    setError(false);
    try {
      setActivity(await requestActivity());
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    let cancelled = false;
    requestActivity()
      .then(data => { if (!cancelled) setActivity(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  const days = useMemo(
    () => activity ? buildDays(activity.year, activity.calendar) : [],
    [activity],
  );

  const monthMarkers = useMemo(() => {
    if (!activity) return [];
    const yearStartDay = new Date(Date.UTC(activity.year, 0, 1)).getUTCDay();
    return Array.from({ length: 12 }, (_, month) => {
      const first = new Date(Date.UTC(activity.year, month, 1));
      const dayOfYear = Math.floor((first.getTime() - Date.UTC(activity.year, 0, 1)) / 86_400_000);
      return { label: first.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), week: Math.floor((yearStartDay + dayOfYear) / 7) };
    });
  }, [activity]);

  return <div className="leetcode-card card">
    <div className="leetcode-card-head">
      <div><span className="eyebrow">Live activity</span><h3>Vs2hmj5a8n</h3></div>
      <a className="button secondary" href="https://leetcode.com/u/Vs2hmj5a8n/" target="_blank" rel="noreferrer">View LeetCode <ExternalLink /></a>
    </div>

    {activity && <>
      <div className="leetcode-stats" aria-label={`${activity.year} LeetCode statistics`}>
        <div><strong>{activity.streak}</strong><span>Current streak</span></div>
        <div><strong>{activity.totalActiveDays}</strong><span>Active days</span></div>
        <div><strong>{activity.totalSubmissions}</strong><span>Submissions</span></div>
      </div>
      <div className="heatmap-scroll" role="img" aria-label={`LeetCode submission heatmap for ${activity.year}`}>
        <div className="heatmap-inner">
          <div className="heatmap-months" aria-hidden="true">{monthMarkers.map(marker => <span key={marker.label} style={{ left: marker.week * 14 }}>{marker.label}</span>)}</div>
          <div className="heatmap-body">
            <div className="heatmap-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div>
            <div className="leetcode-grid">
              {days.map((day, index) => <span
                className="heatmap-day"
                data-level={day.level}
                key={day.timestamp}
                style={{
                  gridColumnStart: Math.floor(((days[0]?.date.getUTCDay() ?? 0) + index) / 7) + 1,
                  gridRowStart: day.date.getUTCDay() + 1,
                }}
                title={`${day.dateLabel}: ${day.count} ${day.count === 1 ? "submission" : "submissions"}`}
                aria-label={`${day.dateLabel}: ${day.count} ${day.count === 1 ? "submission" : "submissions"}`}
              />)}
            </div>
          </div>
        </div>
      </div>
      <div className="heatmap-legend"><span>Less</span>{[0,1,2,3,4].map(level=><i key={level} data-level={level}/>)}<span>More</span></div>
    </>}

    {!activity && !error && <div className="leetcode-loading" aria-label="Loading LeetCode activity"><i/><i/><i/></div>}
    {error && <div className="leetcode-error"><p>LeetCode activity is temporarily unavailable.</p><button className="button secondary" type="button" onClick={loadActivity}>Try again</button></div>}
  </div>;
}
