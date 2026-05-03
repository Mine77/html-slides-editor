import { Image, Paperclip, Send, Sparkles, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { Conversation, ConversationContent } from "./ai-elements/conversation";
import { Message, MessageContent } from "./ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "./ai-elements/prompt-input";
import { Suggestion, Suggestions } from "./ai-elements/suggestion";
import { Button } from "./ui/button";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const SAMPLE_MESSAGES = [
  {
    id: "assistant-intro",
    role: "assistant",
    text: "Tell me what you want to change on this slide. I can help with copy, layout, visual hierarchy, or speaker-note style edits.",
  },
  {
    id: "user-request",
    role: "user",
    text: "Make the title feel sharper and suggest a cleaner layout for the comparison section.",
  },
  {
    id: "assistant-draft",
    role: "assistant",
    text: "I would tighten the headline, reduce the paragraph width, and make the two comparison columns use matching rhythm before changing colors.",
  },
] as const;

const FORM_OPTIONS = {
  tone: ["Sharper", "Warmer", "Executive"],
  layout: ["More structure", "More whitespace", "Stronger contrast"],
  scope: ["Selected element", "Current slide", "Whole deck"],
} as const;

const SUGGESTIONS = [
  "Rewrite selected text",
  "Improve this layout",
  "Make this slide cleaner",
  "Suggest a visual direction",
] as const;

type FormField = keyof typeof FORM_OPTIONS;

function ChatPanel() {
  const [draftPrompt, setDraftPrompt] = useState("");
  const [formSelections, setFormSelections] = useState<Record<FormField, string>>({
    tone: FORM_OPTIONS.tone[0],
    layout: FORM_OPTIONS.layout[0],
    scope: FORM_OPTIONS.scope[1],
  });

  const inlineFormPrompt = useMemo(() => {
    return `Revise the ${formSelections.scope.toLowerCase()} using ${formSelections.tone.toLowerCase()} tone and ${formSelections.layout.toLowerCase()}.`;
  }, [formSelections]);

  const updateInlineForm = (field: FormField, value: string) => {
    const nextSelections = { ...formSelections, [field]: value };
    setFormSelections(nextSelections);
    setDraftPrompt(
      `Revise the ${nextSelections.scope.toLowerCase()} using ${nextSelections.tone.toLowerCase()} tone and ${nextSelections.layout.toLowerCase()}.`
    );
  };

  return (
    <div className="flex min-h-0 w-full flex-auto flex-col gap-3">
      <Conversation aria-label="Chat conversation">
        <ConversationContent>
          {SAMPLE_MESSAGES.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent
                from={message.role}
                className={cn(message.role === "user" && "max-w-[92%]")}
              >
                <p className="m-0 text-[13px] leading-normal">{message.text}</p>
              </MessageContent>
            </Message>
          ))}

          <Message from="assistant">
            <MessageContent className="max-w-full p-3">
              <div className="mb-3 grid gap-1">
                <strong className="text-[13px] leading-tight">Choose an edit direction</strong>
                <p className="m-0 text-xs text-muted-foreground">
                  Selections become the next prompt draft.
                </p>
              </div>

              <div className="grid gap-3">
                {(Object.keys(FORM_OPTIONS) as FormField[]).map((field) => (
                  <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0" key={field}>
                    <legend className="p-0 text-[10px] font-semibold uppercase leading-tight text-muted-foreground">
                      {field}
                    </legend>
                    <ToggleGroup
                      type="single"
                      value={formSelections[field]}
                      className="flex w-full flex-wrap justify-start gap-1.5"
                      aria-label={`${field} options`}
                      onValueChange={(nextValue) => {
                        if (nextValue) {
                          updateInlineForm(field, nextValue);
                        }
                      }}
                    >
                      {FORM_OPTIONS[field].map((option) => (
                        <ToggleGroupItem
                          className="h-7 rounded-lg border border-border bg-card/60 px-2 text-xs font-medium text-muted-foreground data-[state=on]:border-primary/30 data-[state=on]:bg-primary/10 data-[state=on]:text-accent-foreground"
                          key={option}
                          value={option}
                        >
                          {option}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </fieldset>
                ))}
              </div>

              <Button
                className="mt-3 w-full"
                size="sm"
                type="button"
                onClick={() => {
                  setDraftPrompt(inlineFormPrompt);
                }}
              >
                Use as next prompt
              </Button>
            </MessageContent>
          </Message>
        </ConversationContent>
      </Conversation>

      <Suggestions aria-label="Suggested prompts">
        {SUGGESTIONS.map((suggestion) => (
          <Suggestion
            type="button"
            key={suggestion}
            onClick={() => {
              setDraftPrompt(suggestion);
            }}
          >
            <Sparkles aria-hidden="true" />
            {suggestion}
          </Suggestion>
        ))}
      </Suggestions>

      <PromptInput aria-label="Chat prompt input">
        <PromptInputTextarea
          rows={4}
          placeholder="Ask for edits to the current slide..."
          value={draftPrompt}
          onChange={(event) => {
            setDraftPrompt(event.target.value);
          }}
        />
        <PromptInputToolbar>
          <PromptInputTools aria-label="Prompt tools">
            <PromptInputButton type="button" aria-label="Attach file">
              <Paperclip aria-hidden="true" />
            </PromptInputButton>
            <PromptInputButton type="button" aria-label="Reference image">
              <Image aria-hidden="true" />
            </PromptInputButton>
            <PromptInputButton type="button" aria-label="Prompt tools">
              <Wand2 aria-hidden="true" />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit type="button" aria-label="Send message">
            <Send aria-hidden="true" />
          </PromptInputSubmit>
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

export { ChatPanel };
