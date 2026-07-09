import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Square,
  SquareCheckBig,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import {
  MAX_QUESTION_TIME,
  MIN_QUESTION_TIME,
  QUESTION_TIME_CTRL_SHIFT_STEP,
  QUESTION_TIME_CTRL_STEP,
  QUESTION_TIME_SHIFT_STEP,
  QUESTION_TIME_STEP,
  QUESTION_TYPE_OPTIONS,
  getQuestionTypeLabel,
  parseAnswerConfig,
  parseQuestionTimeSeconds,
  parseQuestionType,
  parseSettingScope,
  parseShuffleMode,
  summarizeQuestionAnswer,
  type QuestionType,
  type SettingScope,
  type ShuffleMode,
} from "@/lib/game";
import { ShuffleSettingField } from "@/components/host/ShuffleSettingField";
import { DeckExportMenu } from "@/components/host/DeckExportMenu";
import type { DeckExportData } from "@/lib/deck-import-export";
import { cn } from "@/lib/utils";

const MIN_MC_OPTIONS = 2;
const INITIAL_MC_OPTIONS = 4;
const MAX_MC_OPTIONS = 8;
const TF_OPTIONS = ["True", "False"] as const;

function createEmptyOptions(count: number) {
  return Array.from({ length: count }, () => "");
}

function isNumberOnStep(value: number, min: number, step: number): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(min) || step <= 0) return false;
  const steps = (value - min) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

function getNonEmptyOptions(options: string[]): string[] {
  return options.map((option) => option.trim()).filter(Boolean);
}

function DeckDetailsForm({
  deck,
}: {
  deck: { id: string; title: string; description?: string | null };
}) {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");

  const handleSaveDeck = async () => {
    await db.transact(
      db.tx.decks[deck.id].update({
        title: title.trim(),
        description: description.trim(),
      }),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Deck details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
          />
        </div>
        <Button onClick={() => void handleSaveDeck()}>Save details</Button>
      </CardContent>
    </Card>
  );
}

function DeckSettingsForm({
  deck,
}: {
  deck: {
    id: string;
    answerShuffleMode?: string | null;
    questionShuffleMode?: string | null;
    answerShuffleScope?: string | null;
    questionShuffleScope?: string | null;
    questionTimeSeconds?: number | null;
  };
}) {
  const [answerShuffleMode, setAnswerShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.answerShuffleMode),
  );
  const [questionShuffleMode, setQuestionShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.questionShuffleMode),
  );
  const [answerShuffleScope, setAnswerShuffleScope] = useState<SettingScope>(
    parseSettingScope(deck.answerShuffleScope),
  );
  const [questionShuffleScope, setQuestionShuffleScope] =
    useState<SettingScope>(parseSettingScope(deck.questionShuffleScope));
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(
    String(parseQuestionTimeSeconds(deck.questionTimeSeconds)),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await db.transact(
        db.tx.decks[deck.id].update({
          answerShuffleMode,
          questionShuffleMode,
          answerShuffleScope,
          questionShuffleScope,
          questionTimeSeconds:
            parseQuestionTimeSeconds(questionTimeSeconds),
        }),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
        <CardDescription>
          Default settings used when this deck is launched or rematched.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ShuffleSettingField
          label="Answer option order"
          mode={answerShuffleMode}
          scope={answerShuffleScope}
          onModeChange={setAnswerShuffleMode}
          onScopeChange={setAnswerShuffleScope}
        />

        <ShuffleSettingField
          label="Question order"
          mode={questionShuffleMode}
          scope={questionShuffleScope}
          onModeChange={setQuestionShuffleMode}
          onScopeChange={setQuestionShuffleScope}
        />

        <div className="space-y-2">
          <Label htmlFor="deck-question-time">Seconds per question</Label>
          <NumberInput
            id="deck-question-time"
            value={questionTimeSeconds}
            onChange={setQuestionTimeSeconds}
            min={MIN_QUESTION_TIME}
            max={MAX_QUESTION_TIME}
            step={QUESTION_TIME_STEP}
            ctrlStep={QUESTION_TIME_CTRL_STEP}
            shiftStep={QUESTION_TIME_SHIFT_STEP}
            ctrlShiftStep={QUESTION_TIME_CTRL_SHIFT_STEP}
            inputClassName="max-w-40"
          />
        </div>

        <Button onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CorrectOptionButton({
  selected,
  disabled,
  onClick,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = selected ? SquareCheckBig : Square;

  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      size="sm"
      disabled={disabled}
      onClick={onClick}
      className={cn("gap-1.5", selected && "bg-primary text-primary-foreground")}
    >
      <Icon className="size-4" />
      Correct
    </Button>
  );
}

export function DeckBuilder() {
  const { deckId } = useParams({ from: "/_host/d/$deckId" });
  const { user } = db.useAuth();
  const { isLoading, data, error } = db.useQuery({
    decks: {
      $: { where: { id: deckId } },
      questions: {},
      owner: {},
    },
  });

  const deck = data?.decks?.[0];
  const isOwner = Boolean(deck && user && deck.owner?.id === user.id);
  const questions = [...(deck?.questions ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  const [draftType, setDraftType] = useState<QuestionType>("mc");
  const [draftText, setDraftText] = useState("");
  const [draftOptions, setDraftOptions] = useState(() =>
    createEmptyOptions(INITIAL_MC_OPTIONS),
  );
  const [draftCorrect, setDraftCorrect] = useState(0);
  const [draftCorrectIndices, setDraftCorrectIndices] = useState<number[]>([0]);
  const [draftSelectCount, setDraftSelectCount] = useState("1");
  const [draftCorrectText, setDraftCorrectText] = useState("");
  const [draftNumberMin, setDraftNumberMin] = useState("0");
  const [draftNumberMax, setDraftNumberMax] = useState("10");
  const [draftNumberStep, setDraftNumberStep] = useState("1");
  const [draftNumberValue, setDraftNumberValue] = useState("5");
  const [editingId, setEditingId] = useState<string | null>(null);

  const trimmedDraftOptions = draftOptions.map((option) => option.trim());
  const nonEmptyDraftOptions = getNonEmptyOptions(draftOptions);
  const nonEmptyDraftOptionsCount = nonEmptyDraftOptions.length;

  const numberMin = Number(draftNumberMin);
  const numberMax = Number(draftNumberMax);
  const numberStep = Number(draftNumberStep);
  const numberValue = Number(draftNumberValue);
  const isNumberLineValid =
    Number.isFinite(numberMin) &&
    Number.isFinite(numberMax) &&
    Number.isFinite(numberStep) &&
    Number.isFinite(numberValue) &&
    numberStep > 0 &&
    numberMin < numberMax &&
    numberValue >= numberMin &&
    numberValue <= numberMax &&
    isNumberOnStep(numberValue, numberMin, numberStep);

  const canSaveQuestion = (() => {
    if (!draftText.trim()) return false;

    switch (draftType) {
      case "tf":
        return draftCorrect === 0 || draftCorrect === 1;
      case "mc":
        return (
          nonEmptyDraftOptionsCount >= MIN_MC_OPTIONS &&
          Boolean(trimmedDraftOptions[draftCorrect])
        );
      case "typeIn":
        return Boolean(draftCorrectText.trim());
      case "numberLine":
        return isNumberLineValid;
      case "order":
        return nonEmptyDraftOptionsCount >= MIN_MC_OPTIONS;
      case "exactSet":
        return (
          nonEmptyDraftOptionsCount >= MIN_MC_OPTIONS &&
          draftCorrectIndices.length > 0 &&
          draftCorrectIndices.every(
            (index) =>
              index >= 0 &&
              index < draftOptions.length &&
              Boolean(trimmedDraftOptions[index]),
          )
        );
      case "selectN": {
        const selectCount = Number(draftSelectCount);
        return (
          nonEmptyDraftOptionsCount >= MIN_MC_OPTIONS &&
          draftCorrectIndices.length > 0 &&
          Number.isFinite(selectCount) &&
          selectCount >= 1 &&
          selectCount <= draftCorrectIndices.length &&
          draftCorrectIndices.every(
            (index) =>
              index >= 0 &&
              index < draftOptions.length &&
              Boolean(trimmedDraftOptions[index]),
          )
        );
      }
      default:
        return false;
    }
  })();

  const resetDraft = () => {
    setDraftType("mc");
    setDraftText("");
    setDraftOptions(createEmptyOptions(INITIAL_MC_OPTIONS));
    setDraftCorrect(0);
    setDraftCorrectIndices([0]);
    setDraftSelectCount("1");
    setDraftCorrectText("");
    setDraftNumberMin("0");
    setDraftNumberMax("10");
    setDraftNumberStep("1");
    setDraftNumberValue("5");
    setEditingId(null);
  };

  const handleTypeChange = (nextType: QuestionType) => {
    setDraftType(nextType);
    if (nextType === "tf") {
      setDraftOptions([...TF_OPTIONS]);
      setDraftCorrect(0);
      setDraftCorrectIndices([]);
      return;
    }

    if (nextType === "typeIn" || nextType === "numberLine") {
      setDraftOptions([]);
      setDraftCorrectIndices([]);
      return;
    }

    if (
      nextType === "order" ||
      nextType === "exactSet" ||
      nextType === "selectN" ||
      nextType === "mc"
    ) {
      if (draftOptions.length < MIN_MC_OPTIONS) {
        setDraftOptions(createEmptyOptions(INITIAL_MC_OPTIONS));
      }
      setDraftCorrect(0);
      setDraftCorrectIndices([0]);
      if (nextType === "selectN") {
        setDraftSelectCount("1");
      }
    }
  };

  const handleAddOption = () => {
    if (draftOptions.length >= MAX_MC_OPTIONS) return;
    setDraftOptions([...draftOptions, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (draftOptions.length <= INITIAL_MC_OPTIONS) return;
    const next = draftOptions.filter((_, i) => i !== index);
    setDraftOptions(next);
    if (draftType === "mc" || draftType === "tf") {
      if (draftCorrect === index) {
        const firstFilled = next.findIndex((v) => Boolean(v.trim()));
        setDraftCorrect(firstFilled >= 0 ? firstFilled : 0);
      } else if (draftCorrect > index) {
        setDraftCorrect(draftCorrect - 1);
      }
      return;
    }

    setDraftCorrectIndices((current) =>
      current
        .filter((value) => value !== index)
        .map((value) => (value > index ? value - 1 : value)),
    );
  };

  const handleMoveDraftOption = (index: number, direction: -1 | 1) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= draftOptions.length) return;
    const next = [...draftOptions];
    [next[index], next[swapIndex]] = [next[swapIndex]!, next[index]!];
    setDraftOptions(next);

    if (draftType === "mc") {
      if (draftCorrect === index) setDraftCorrect(swapIndex);
      else if (draftCorrect === swapIndex) setDraftCorrect(index);
      return;
    }

    setDraftCorrectIndices((current) =>
      current.map((value) => {
        if (value === index) return swapIndex;
        if (value === swapIndex) return index;
        return value;
      }),
    );
  };

  const toggleDraftCorrectIndex = (index: number) => {
    setDraftCorrectIndices((current) => {
      if (current.includes(index)) {
        const next = current.filter((value) => value !== index);
        return next.length > 0 ? next : [index];
      }
      return [...current, index].sort((a, b) => a - b);
    });
  };

  const buildQuestionPayload = () => {
    const text = draftText.trim();

    switch (draftType) {
      case "tf":
        return {
          text,
          questionType: draftType,
          options: [...TF_OPTIONS],
          correctIndex: draftCorrect === 1 ? 1 : 0,
          answerConfig: null,
        };
      case "mc": {
        const trimmedOptions = draftOptions.map((option) => option.trim());
        const nonEmptyOptions = trimmedOptions.filter(Boolean);
        let correctIndex = -1;
        let nonEmptyCount = 0;
        for (let i = 0; i < trimmedOptions.length; i++) {
          if (!trimmedOptions[i]) continue;
          if (i === draftCorrect) correctIndex = nonEmptyCount;
          nonEmptyCount++;
        }
        return {
          text,
          questionType: draftType,
          options: nonEmptyOptions,
          correctIndex,
          answerConfig: null,
        };
      }
      case "typeIn":
        return {
          text,
          questionType: draftType,
          options: [],
          correctIndex: null,
          answerConfig: { correctText: draftCorrectText.trim() },
        };
      case "numberLine":
        return {
          text,
          questionType: draftType,
          options: [],
          correctIndex: null,
          answerConfig: {
            min: numberMin,
            max: numberMax,
            step: numberStep,
            correctValue: numberValue,
          },
        };
      case "order":
        return {
          text,
          questionType: draftType,
          options: nonEmptyDraftOptions,
          correctIndex: null,
          answerConfig: {},
        };
      case "exactSet": {
        const trimmedOptions = draftOptions.map((option) => option.trim());
        const nonEmptyOptions = trimmedOptions.filter(Boolean);
        const correctIndices: number[] = [];
        let nonEmptyCount = 0;
        for (let i = 0; i < trimmedOptions.length; i++) {
          if (!trimmedOptions[i]) continue;
          if (draftCorrectIndices.includes(i)) {
            correctIndices.push(nonEmptyCount);
          }
          nonEmptyCount++;
        }
        return {
          text,
          questionType: draftType,
          options: nonEmptyOptions,
          correctIndex: null,
          answerConfig: { correctIndices },
        };
      }
      case "selectN": {
        const trimmedOptions = draftOptions.map((option) => option.trim());
        const nonEmptyOptions = trimmedOptions.filter(Boolean);
        const correctIndices: number[] = [];
        let nonEmptyCount = 0;
        for (let i = 0; i < trimmedOptions.length; i++) {
          if (!trimmedOptions[i]) continue;
          if (draftCorrectIndices.includes(i)) {
            correctIndices.push(nonEmptyCount);
          }
          nonEmptyCount++;
        }
        return {
          text,
          questionType: draftType,
          options: nonEmptyOptions,
          correctIndex: null,
          answerConfig: {
            correctIndices,
            selectCount: Number(draftSelectCount),
          },
        };
      }
      default:
        return null;
    }
  };

  const handleSaveQuestion = async () => {
    if (!deck || !canSaveQuestion) return;
    const payload = buildQuestionPayload();
    if (!payload) return;

    if (editingId) {
      await db.transact(db.tx.questions[editingId].update(payload));
    } else {
      const questionId = id();
      await db.transact(
        db.tx.questions[questionId]
          .update({
            ...payload,
            order: questions.length,
          })
          .link({ deck: deck.id }),
      );
    }

    resetDraft();
  };

  const handleEdit = (questionId: string) => {
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    const type = parseQuestionType(question.questionType);
    setEditingId(questionId);
    setDraftText(question.text);
    setDraftType(type);

    const existingOptions = Array.isArray(question.options)
      ? (question.options as string[])
      : [];

    if (type === "tf") {
      setDraftOptions([...TF_OPTIONS]);
      setDraftCorrect(
        question.correctIndex === 1 || existingOptions[0] === "False" ? 1 : 0,
      );
      setDraftCorrectIndices([]);
      return;
    }

    if (type === "typeIn") {
      const config = parseAnswerConfig(
        "typeIn",
        question.answerConfig,
      ) as import("@/lib/game").TypeInAnswerConfig | undefined;
      setDraftOptions([]);
      setDraftCorrectText(config?.correctText ?? "");
      return;
    }

    if (type === "numberLine") {
      const config = parseAnswerConfig(
        "numberLine",
        question.answerConfig,
      ) as import("@/lib/game").NumberLineAnswerConfig | undefined;
      setDraftOptions([]);
      setDraftNumberMin(String(config?.min ?? 0));
      setDraftNumberMax(String(config?.max ?? 10));
      setDraftNumberStep(String(config?.step ?? 1));
      setDraftNumberValue(String(config?.correctValue ?? 5));
      return;
    }

    const visibleCount = Math.min(
      MAX_MC_OPTIONS,
      Math.max(INITIAL_MC_OPTIONS, existingOptions.length),
    );
    const nextOptions = [
      ...existingOptions,
      ...createEmptyOptions(visibleCount),
    ].slice(0, visibleCount);
    setDraftOptions(nextOptions);

    if (type === "mc") {
      setDraftCorrect(
        question.correctIndex != null &&
          question.correctIndex >= 0 &&
          question.correctIndex < existingOptions.length
          ? question.correctIndex
          : 0,
      );
      setDraftCorrectIndices([]);
      return;
    }

    if (type === "order") {
      setDraftCorrectIndices([]);
      return;
    }

    if (type === "exactSet") {
      const config = parseAnswerConfig(
        "exactSet",
        question.answerConfig,
      ) as import("@/lib/game").ExactSetAnswerConfig | undefined;
      setDraftCorrectIndices(config?.correctIndices ?? [0]);
      return;
    }

    if (type === "selectN") {
      const config = parseAnswerConfig(
        "selectN",
        question.answerConfig,
      ) as import("@/lib/game").SelectNAnswerConfig | undefined;
      setDraftCorrectIndices(config?.correctIndices ?? [0]);
      setDraftSelectCount(String(config?.selectCount ?? 1));
    }
  };

  const handleDelete = async (questionId: string) => {
    await db.transact(db.tx.questions[questionId].delete());
    if (editingId === questionId) resetDraft();
  };

  const handleMove = async (questionId: string, direction: -1 | 1) => {
    const index = questions.findIndex((item) => item.id === questionId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= questions.length) return;

    const current = questions[index];
    const swap = questions[swapIndex];
    await db.transact([
      db.tx.questions[current.id].update({ order: swap.order }),
      db.tx.questions[swap.id].update({ order: current.order }),
    ]);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  if (error || !deck) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Deck not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!isOwner || deck.isBuiltIn) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Cannot edit this deck</CardTitle>
            <CardDescription>
              Built-in decks are read-only. Duplicate questions into your own
              deck from the host dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Badge variant="outline">Quiz builder</Badge>
          <h1 className="mt-2 text-2xl font-semibold">Edit deck</h1>
        </div>
        <div className="flex items-center gap-2">
          <DeckExportMenu
            deck={{
              title: deck.title,
              description: deck.description,
              answerShuffleMode: deck.answerShuffleMode,
              questionShuffleMode: deck.questionShuffleMode,
              answerShuffleScope: deck.answerShuffleScope,
              questionShuffleScope: deck.questionShuffleScope,
              questionTimeSeconds: deck.questionTimeSeconds,
              questions: questions.map((question) => ({
                text: question.text,
                options: Array.isArray(question.options)
                  ? question.options.map(String)
                  : [],
                correctIndex: question.correctIndex,
                order: question.order,
                questionType: parseQuestionType(question.questionType),
                answerConfig:
                  question.answerConfig &&
                  typeof question.answerConfig === "object"
                    ? (question.answerConfig as DeckExportData["questions"][number]["answerConfig"])
                    : null,
              })),
            }}
          />
          <Button asChild variant="outline" size="sm">
            <Link to="/">Back</Link>
          </Button>
        </div>
      </div>

      <DeckDetailsForm key={`details-${deck.id}`} deck={deck} />
      <DeckSettingsForm key={`settings-${deck.id}`} deck={deck} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Edit question" : "Add question"}
          </CardTitle>
          <CardDescription>
            Choose a question type and configure the correct answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question type</Label>
            <Select
              value={draftType}
              onValueChange={(value) =>
                handleTypeChange(parseQuestionType(value))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {
                QUESTION_TYPE_OPTIONS.find((option) => option.id === draftType)
                  ?.description
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-text">Question</Label>
            <Textarea
              id="question-text"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={2}
            />
          </div>

          {draftType === "typeIn" ? (
            <div className="space-y-2">
              <Label htmlFor="correct-text">Correct answer</Label>
              <Input
                id="correct-text"
                value={draftCorrectText}
                onChange={(event) => setDraftCorrectText(event.target.value)}
                placeholder="Exact answer players must type"
              />
              <p className="text-sm text-muted-foreground">
                Matching is case-insensitive with trimmed whitespace.
              </p>
            </div>
          ) : null}

          {draftType === "numberLine" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number-min">Minimum</Label>
                <NumberInput
                  id="number-min"
                  value={draftNumberMin}
                  onChange={setDraftNumberMin}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-max">Maximum</Label>
                <NumberInput
                  id="number-max"
                  value={draftNumberMax}
                  onChange={setDraftNumberMax}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-step">Step</Label>
                <NumberInput
                  id="number-step"
                  value={draftNumberStep}
                  onChange={setDraftNumberStep}
                  min={0.0001}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number-value">Correct value</Label>
                <NumberInput
                  id="number-value"
                  value={draftNumberValue}
                  onChange={setDraftNumberValue}
                />
              </div>
              {!isNumberLineValid ? (
                <p className="text-sm text-destructive sm:col-span-2">
                  Set a valid range, step, and exact correct value on that step.
                </p>
              ) : null}
            </div>
          ) : null}

          {draftType === "tf" ? (
            <div className="space-y-3">
              <Label>Correct answer</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {TF_OPTIONS.map((label, index) => (
                  <Button
                    key={label}
                    type="button"
                    variant={draftCorrect === index ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setDraftCorrect(index)}
                  >
                    {draftCorrect === index ? (
                      <SquareCheckBig className="size-4" />
                    ) : (
                      <Square className="size-4" />
                    )}
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          ) : draftType === "mc" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                At least {MIN_MC_OPTIONS} options are required; you can add up
                to {MAX_MC_OPTIONS}.
              </p>
              {draftOptions.map((option, index) => {
                const isOptionFilled = Boolean(option.trim());

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`option-${index}`}>
                        Option {index + 1}
                      </Label>
                      <div className="flex items-center gap-2">
                        <CorrectOptionButton
                          selected={draftCorrect === index}
                          disabled={!isOptionFilled}
                          onClick={() => setDraftCorrect(index)}
                        />
                        {draftOptions.length > INITIAL_MC_OPTIONS ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveOption(index)}
                            aria-label={`Remove option ${index + 1}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <Input
                      id={`option-${index}`}
                      value={option}
                      onChange={(event) => {
                        const next = [...draftOptions];
                        next[index] = event.target.value;

                        if (
                          index === draftCorrect &&
                          !event.target.value.trim()
                        ) {
                          const firstFilledIndex = next.findIndex((v) =>
                            Boolean(v.trim()),
                          );
                          setDraftCorrect(
                            firstFilledIndex >= 0 ? firstFilledIndex : 0,
                          );
                        }

                        setDraftOptions(next);
                      }}
                    />
                  </div>
                );
              })}
              {draftOptions.length < MAX_MC_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              ) : null}
            </div>
          ) : draftType === "order" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                List items in the correct order. Players will reorder a shuffled
                list during play.
              </p>
              {draftOptions.map((option, index) => (
                <div key={index} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor={`order-option-${index}`}>
                      Position {index + 1}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleMoveDraftOption(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleMoveDraftOption(index, 1)}
                        disabled={index === draftOptions.length - 1}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      {draftOptions.length > INITIAL_MC_OPTIONS ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveOption(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <Input
                    id={`order-option-${index}`}
                    value={option}
                    onChange={(event) => {
                      const next = [...draftOptions];
                      next[index] = event.target.value;
                      setDraftOptions(next);
                    }}
                  />
                </div>
              ))}
              {draftOptions.length < MAX_MC_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                >
                  <Plus className="size-4" />
                  Add item
                </Button>
              ) : null}
            </div>
          ) : draftType === "exactSet" || draftType === "selectN" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {draftType === "exactSet"
                  ? "Mark every correct option. Players must select the exact set."
                  : "Mark the correct pool, then set how many players must pick."}
              </p>
              {draftType === "selectN" ? (
                <div className="space-y-2">
                  <Label htmlFor="select-count">Pick exactly N</Label>
                  <NumberInput
                    id="select-count"
                    value={draftSelectCount}
                    onChange={setDraftSelectCount}
                    min={1}
                    max={Math.max(1, draftCorrectIndices.length)}
                  />
                </div>
              ) : null}
              {draftOptions.map((option, index) => {
                const isOptionFilled = Boolean(option.trim());
                const isMarked = draftCorrectIndices.includes(index);

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`multi-option-${index}`}>
                        Option {index + 1}
                      </Label>
                      <div className="flex items-center gap-2">
                        <CorrectOptionButton
                          selected={isMarked}
                          disabled={!isOptionFilled}
                          onClick={() => toggleDraftCorrectIndex(index)}
                        />
                        {draftOptions.length > INITIAL_MC_OPTIONS ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleRemoveOption(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <Input
                      id={`multi-option-${index}`}
                      value={option}
                      onChange={(event) => {
                        const next = [...draftOptions];
                        next[index] = event.target.value;
                        setDraftOptions(next);
                      }}
                    />
                  </div>
                );
              })}
              {draftOptions.length < MAX_MC_OPTIONS ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddOption}
                >
                  <Plus className="size-4" />
                  Add option
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="flex gap-2">
            <Button
              onClick={() => void handleSaveQuestion()}
              disabled={!canSaveQuestion}
            >
              {editingId ? "Update question" : "Add question"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetDraft}>
                Cancel
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Questions ({questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions yet. Add your first question above.
            </p>
          ) : (
            questions.map((question, index) => {
              const type = parseQuestionType(question.questionType);
              const options = Array.isArray(question.options)
                ? (question.options as string[])
                : [];
              const summary = summarizeQuestionAnswer({
                questionType: type,
                options,
                correctIndex: question.correctIndex,
                answerConfig: question.answerConfig as never,
              });

              return (
                <div
                  key={question.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        {index + 1}. {question.text}
                      </p>
                      <Badge variant="secondary">
                        {getQuestionTypeLabel(type)}
                      </Badge>
                    </div>
                    {type === "mc" || type === "tf" ? (
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {options.map((option, optionIndex) => (
                          <li
                            key={optionIndex}
                            className={
                              optionIndex === question.correctIndex
                                ? "font-medium text-foreground"
                                : undefined
                            }
                          >
                            {optionIndex === question.correctIndex ? "✓ " : "· "}
                            {option}
                          </li>
                        ))}
                      </ul>
                    ) : type === "order" ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {summary}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-foreground">
                        Answer: {summary}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleMove(question.id, -1)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleMove(question.id, 1)}
                      disabled={index === questions.length - 1}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(question.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => void handleDelete(question.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </main>
  );
}
