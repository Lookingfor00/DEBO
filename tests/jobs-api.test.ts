import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("listJobs / getJob", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.JOBS_API_URL = "http://admin.test/api/public/jobs";
    process.env.JOBS_READ_KEY = "secret-key";
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.JOBS_API_URL;
    delete process.env.JOBS_READ_KEY;
  });

  it("listJobs sends Bearer and filter query without project=", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0 }), { status: 200 }),
    );
    const { listJobs } = await import("@/lib/api/jobs");
    await listJobs({
      q: "Dev",
      company: "Acme",
      location: "Paris",
      publishAfter: "2026-01-01",
      limit: 20,
      offset: 40,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe(
      "http://admin.test/api/public/jobs",
    );
    expect(parsed.searchParams.get("q")).toBe("Dev");
    expect(parsed.searchParams.get("company")).toBe("Acme");
    expect(parsed.searchParams.get("location")).toBe("Paris");
    expect(parsed.searchParams.get("publish_after")).toBe("2026-01-01");
    expect(parsed.searchParams.get("limit")).toBe("20");
    expect(parsed.searchParams.get("offset")).toBe("40");
    expect(parsed.searchParams.get("project")).toBeNull();
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret-key",
    );
  });

  it("getJob fetches /{id} with Bearer", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          item: {
            id: "abc",
            title: "Dev",
            source_url: "https://ex.com/1",
            company: null,
            location: null,
            publish_at: null,
            description_md: "hi",
            external_id: null,
            deadline: null,
          },
        }),
        { status: 200 },
      ),
    );
    const { getJob } = await import("@/lib/api/jobs");
    const job = await getJob("abc");
    expect(job?.id).toBe("abc");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://admin.test/api/public/jobs/abc");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer secret-key",
    );
  });

  it("getJob returns null on 404", async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue(new Response("{}", { status: 404 }));
    const { getJob } = await import("@/lib/api/jobs");
    expect(await getJob("missing")).toBeNull();
  });
});
