import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WordForm } from "@/components/word-form";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("word meaning suggestions", () => {
  it("requests and fills a concise meaning for the entered word", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ meaning: "A happy accident or unexpected discovery." }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<WordForm submitLabel="Save word" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Word *"), { target: { value: "serendipity" } });

    expect(screen.getByRole("tooltip")).toHaveTextContent("Get meaning");
    fireEvent.click(screen.getByRole("button", { name: "Get meaning" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Meaning *")).toHaveValue("A happy accident or unexpected discovery.");
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/words/meaning",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "serendipity" }),
      }),
    );
  });

  it("shows a clear message when the meaning request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "Meaning service unavailable. Please try again." }, { status: 502 })),
    );

    render(<WordForm submitLabel="Save word" onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Word *"), { target: { value: "serendipity" } });
    fireEvent.click(screen.getByRole("button", { name: "Get meaning" }));

    expect(await screen.findByText("Meaning service unavailable. Please try again.")).toBeInTheDocument();
  });
});
