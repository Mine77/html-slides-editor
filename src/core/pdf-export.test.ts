import { describe, expect, test } from "vitest";
import { planPdfExportSlides } from "./index";

const slides = [
  { id: "slide-one", title: "One" },
  { id: "slide-two", title: "Two" },
  { id: "slide-three", title: "Three" },
];

describe("PDF export planning", () => {
  test("defaults to every slide in order", () => {
    expect(planPdfExportSlides(slides)).toEqual(slides);
    expect(planPdfExportSlides(slides, { mode: "all" })).toEqual(slides);
  });

  test("resolves a single slide id exactly", () => {
    expect(planPdfExportSlides(slides, { mode: "slide", slideId: "slide-two" })).toEqual([
      slides[1],
    ]);
  });

  test("resolves selected slide ids in requested order", () => {
    expect(
      planPdfExportSlides(slides, {
        mode: "slides",
        slideIds: ["slide-three", "slide-one"],
      })
    ).toEqual([slides[2], slides[0]]);
  });

  test("rejects missing or non-exact slide selections", () => {
    expect(() => planPdfExportSlides(slides, { mode: "slide" })).toThrow(
      "--slide requires a slide id value"
    );
    expect(() => planPdfExportSlides(slides, { mode: "slide", slideId: "missing" })).toThrow(
      "--slide must match a slide id exactly: missing"
    );
    expect(() =>
      planPdfExportSlides(slides, {
        mode: "slides",
        slideIds: ["slide-one", "missing"],
      })
    ).toThrow("--slides must match slide ids exactly: missing");
  });
});
