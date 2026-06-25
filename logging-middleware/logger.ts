const LOG_API_URL = "http://4.224.186.213/evaluation-service/logs";
const AUTH_TOKEN = process.env.LOGGER_AUTH_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiIyM3doMWEwNWE1QGJ2cml0aHlkZXJhYmFkLmVkdS5pbiIsImV4cCI6MTc4MjM3NzU1OSwiaWF0IjoxNzgyMzc2NjU5LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiNTZkYTBkYzMtNTYzZS00Njg4LWIwYjAtN2Q2MjhmOTljNTFhIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibWFudHJhbXVydGh5IHNhaSBuZWhhbCIsInN1YiI6IjQwYjkxNWE0LWM3MjQtNDBlNS1hOGU0LTA0MzQ3Mzc0M2E0MiJ9LCJlbWFpbCI6IjIzd2gxYTA1YTVAYnZyaXRoeWRlcmFiYWQuZWR1LmluIiwibmFtZSI6Im1hbnRyYW11cnRoeSBzYWkgbmVoYWwiLCJyb2xsTm8iOiIyM3doMWEwNWE1IiwiYWNjZXNzQ29kZSI6ImFoWGp2cCIsImNsaWVudElEIjoiNDBiOTE1YTQtYzcyNC00MGU1LWE4ZTQtMDQzNDczNzQzYTQyIiwiY2xpZW50U2VjcmV0IjoiZkd0ZndLdHJ4QkhWVWZHdyJ9.5exu0iailb3mpiQrDGZ2TS_UIVsXjBvxN5o0VQ1MSsA";
export async function Log(
  stack: string,   
  level: string,   
  pkg: string,     
  message: string  
): Promise<string | null> {

  const payload = { stack, level, package: pkg, message };
  const time = new Date().toISOString();
  console.log(`[${time}] [${level.toUpperCase()}] [${stack}/${pkg}] ${message}`);

  try {
    const response = await fetch(LOG_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[Logger] Server returned ${response.status} — log not saved`);
      return null;
    }

    const result = await response.json() as { logID?: string };
    return result.logID ?? null;

  } catch (err) {
    console.error(`[Logger] Could not reach log server:`, err);
    return null;
  }
}
export const logger = {
  info:  (pkg: string, message: string) => Log("backend", "info",  pkg, message),
  warn:  (pkg: string, message: string) => Log("backend", "warn",  pkg, message),
  error: (pkg: string, message: string) => Log("backend", "error", pkg, message),
  fatal: (pkg: string, message: string) => Log("backend", "fatal", pkg, message),
  debug: (pkg: string, message: string) => Log("backend", "debug", pkg, message),
};

export default logger;