import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import {
  AnswerOption,
  AnswerOptionGrid,
} from "@/components/game/AnswerOption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  parseAnswerConfig,
  type PlayerAnswerInput,
} from "@/lib/game";
import type { QuestionSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

type QuestionAnswerInputProps = {
  question: QuestionSnapshot;
  disabled?: boolean;
  onSubmit: (input: PlayerAnswerInput) => void;
};

function snapToStep(value: number, min: number, step: number): number {
  const steps = Math.round((value - min) / step);
  return min + steps * step;
}

function nearlyEqual(a: number, b: number, epsilon = 1e-9): boolean {
  return Math.abs(a - b) <= epsilon;
}

function randomNumberLineValueExcludingCorrect({
  min,
  max,
  step,
  correctValue,
}: {
  min: number;
  max: number;
  step: number;
  correctValue: number;
}): number {
  const stepCount = Math.max(1, Math.round((max - min) / step));
  const values: number[] = [];

  for (let i = 0; i <= stepCount; i++) {
    values.push(min + i * step);
  }

  const eligible = values.filter((value) => !nearlyEqual(value, correctValue));
  if (eligible.length === 0) {
    // Degenerate range; fall back to min (can't exclude).
    return min;
  }
  return eligible[Math.floor(Math.random() * eligible.length)]!;
}

function ChoiceAnswerInput({
  question,
  disabled,
  onSubmit,
}: QuestionAnswerInputProps) {
  const options = question.options.slice(0, 8);

  return (
    <AnswerOptionGrid optionCount={options.length} className="w-full">
      {options.map((option, index) => (
        <AnswerOption
          key={index}
          index={index}
          text={option}
          variant="interactive"
          disabled={disabled}
          onClick={() => onSubmit({ kind: "choice", choiceIndex: index })}
        />
      ))}
    </AnswerOptionGrid>
  );
}

function TypeInAnswerInput({
  disabled,
  onSubmit,
}: Omit<QuestionAnswerInputProps, "question">) {
  const [text, setText] = useState("");

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Label htmlFor="player-answer-text" className="sr-only">
        Your answer
      </Label>
      <Input
        id="player-answer-text"
        value={text}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        placeholder="Type your answer"
        className="h-12 text-lg"
        onKeyDown={(event) => {
          if (event.key === "Enter" && text.trim()) {
            onSubmit({ kind: "text", text });
          }
        }}
      />
      <Button
        type="button"
        disabled={disabled || !text.trim()}
        onClick={() => onSubmit({ kind: "text", text })}
        className="self-center"
      >
        Submit answer
      </Button>
    </div>
  );
}

function NumberLineAnswerInput({
  question,
  disabled,
  onSubmit,
}: QuestionAnswerInputProps) {
  const config = parseAnswerConfig(
    "numberLine",
    question.answerConfig,
  ) as import("@/lib/game").NumberLineAnswerConfig | undefined;
  const min = config?.min ?? 0;
  const max = config?.max ?? 10;
  const step = config?.step ?? 1;
  const [value, setValue] = useState(() => {
    if (config) {
      return randomNumberLineValueExcludingCorrect({
        min,
        max,
        step,
        correctValue: config.correctValue,
      });
    }
    return min;
  });

  const snappedValue = snapToStep(value, min, step);
  const clampedValue = Math.min(max, Math.max(min, snappedValue));
  const stepCount = Math.max(1, Math.round((max - min) / step));

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="text-center font-mono text-4xl font-semibold tabular-nums">
        {clampedValue}
      </div>
      <input
        type="range"
        min={0}
        max={stepCount}
        step={1}
        disabled={disabled}
        value={Math.round((clampedValue - min) / step)}
        onChange={(event) => {
          const next = min + Number(event.target.value) * step;
          setValue(next);
        }}
        className="h-2 w-full cursor-pointer accent-primary"
      />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => onSubmit({ kind: "number", value: clampedValue })}
        className="self-center"
      >
        Submit answer
      </Button>
    </div>
  );
}

function OrderAnswerInput({
  question,
  disabled,
  onSubmit,
}: QuestionAnswerInputProps) {
  const originalIndices = useMemo(() => {
    const config = parseAnswerConfig(
      "order",
      question.answerConfig,
    ) as import("@/lib/game").OrderAnswerConfig | undefined;
    return (
      config?.originalIndices ??
      question.options.map((_, index) => index)
    );
  }, [question.answerConfig, question.options]);

  const [displayOrder, setDisplayOrder] = useState(() =>
    question.options.map((_, index) => index),
  );

  const moveItem = (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= displayOrder.length) return;
    setDisplayOrder((current) => {
      const next = [...current];
      [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
      return next;
    });
  };

  const handleSubmit = () => {
    const order = displayOrder.map(
      (displayIndex) => originalIndices[displayIndex] ?? displayIndex,
    );
    onSubmit({ kind: "order", order });
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {displayOrder.map((displayIndex, position) => (
        <div
          key={`${displayIndex}-${position}`}
          className="flex items-center gap-2 rounded-lg border px-3 py-2"
        >
          <span className="w-6 text-sm text-muted-foreground">
            {position + 1}.
          </span>
          <span className="flex-1 text-base">
            {question.options[displayIndex]}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled || position === 0}
            onClick={() => moveItem(position, -1)}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled || position === displayOrder.length - 1}
            onClick={() => moveItem(position, 1)}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        disabled={disabled}
        onClick={handleSubmit}
        className="self-center"
      >
        Submit order
      </Button>
    </div>
  );
}

function MultiSelectAnswerInput({
  question,
  disabled,
  onSubmit,
  exactSet,
}: QuestionAnswerInputProps & { exactSet: boolean }) {
  const config = exactSet
    ? parseAnswerConfig("exactSet", question.answerConfig)
    : parseAnswerConfig("selectN", question.answerConfig);
  const requiredCount = exactSet
    ? (config as { correctIndices: number[] } | undefined)?.correctIndices
        .length ?? 0
    : (config as { selectCount: number } | undefined)?.selectCount ?? 0;

  const [selected, setSelected] = useState<number[]>([]);

  const toggle = (index: number) => {
    setSelected((current) => {
      if (current.includes(index)) {
        return current.filter((value) => value !== index);
      }
      if (!exactSet && current.length >= requiredCount) {
        return current;
      }
      return [...current, index].sort((a, b) => a - b);
    });
  };

  const canSubmit = exactSet
    ? selected.length > 0
    : selected.length === requiredCount;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      {!exactSet ? (
        <p className="text-center text-sm text-muted-foreground">
          Select exactly {requiredCount}
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isSelected = selected.includes(index);
          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => toggle(index)}
              className={cn(
                "rounded-xl border px-4 py-3 text-left text-base transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-background hover:bg-muted/50",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      <Button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={() =>
          onSubmit({ kind: "multi", selectedIndices: selected })
        }
        className="self-center"
      >
        Submit selection
      </Button>
    </div>
  );
}

export function QuestionAnswerInput({
  question,
  disabled,
  onSubmit,
}: QuestionAnswerInputProps) {
  switch (question.questionType) {
    case "typeIn":
      return (
        <TypeInAnswerInput disabled={disabled} onSubmit={onSubmit} />
      );
    case "numberLine":
      return (
        <NumberLineAnswerInput
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "order":
      return (
        <OrderAnswerInput
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
    case "exactSet":
      return (
        <MultiSelectAnswerInput
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
          exactSet
        />
      );
    case "selectN":
      return (
        <MultiSelectAnswerInput
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
          exactSet={false}
        />
      );
    case "mc":
    case "tf":
    default:
      return (
        <ChoiceAnswerInput
          question={question}
          disabled={disabled}
          onSubmit={onSubmit}
        />
      );
  }
}
