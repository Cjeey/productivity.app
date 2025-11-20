import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FocusTimer from "@/components/focus/focus-timer";

describe("FocusTimer component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes onLog with the elapsed duration", async () => {
    const onLog = vi.fn().mockResolvedValue(undefined);
    render(<FocusTimer minutes={1} taskId="task-1" onLog={onLog} />);

    fireEvent.click(screen.getByText(/start session/i));

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    fireEvent.click(screen.getByText(/stop & log/i));

    expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: "task-1",
        durationSeconds: expect.any(Number),
      })
    );
  });
});
