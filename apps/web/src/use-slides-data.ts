import { type SlideModel, loadSlidesFromManifest } from "@html-slides-editor/core";
import { useEffect, useState } from "react";

interface SlidesDataResult {
  slides: SlideModel[];
  sourceLabel: string;
  errorMessage: string | null;
  isLoading: boolean;
}

const GENERATED_MANIFEST_URL = "/generated/current/manifest.json";

export function useSlidesData(): SlidesDataResult {
  const [slides, setSlides] = useState<SlideModel[]>([]);
  const [sourceLabel, setSourceLabel] = useState("Generated deck");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadGeneratedSlides() {
      try {
        const importedDeck = await loadSlidesFromManifest({
          manifestUrl: GENERATED_MANIFEST_URL,
          requestInit: { cache: "no-store" },
          slideIdPrefix: "generated-slide-",
        });

        if (cancelled) {
          return;
        }

        if (!importedDeck) {
          setSlides([]);
          setSourceLabel("Generated deck unavailable");
          setErrorMessage("No generated deck was found at /generated/current/manifest.json.");
          setIsLoading(false);
          return;
        }

        setSlides(importedDeck.slides);
        setSourceLabel(
          importedDeck.manifest.topic
            ? `Generated deck: ${importedDeck.manifest.topic}`
            : "Generated deck from skills/html-slides-generator"
        );
        setErrorMessage(null);
        setIsLoading(false);
      } catch {
        if (cancelled) {
          return;
        }

        setSlides([]);
        setSourceLabel("Generated deck unavailable");
        setErrorMessage("The app could not load the generated deck.");
        setIsLoading(false);
      }
    }

    loadGeneratedSlides();

    return () => {
      cancelled = true;
    };
  }, []);

  return { slides, sourceLabel, errorMessage, isLoading };
}
