import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";

const EMPTY_OPTIONS = Array(8).fill("");

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

  const [draftText, setDraftText] = useState("");
  const [draftOptions, setDraftOptions] = useState(EMPTY_OPTIONS);
  const [draftCorrect, setDraftCorrect] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const trimmedDraftOptions = draftOptions.map((option) => option.trim());
  const nonEmptyDraftOptionsCount = trimmedDraftOptions.filter(Boolean).length;
  const canSaveQuestion =
    Boolean(draftText.trim()) &&
    nonEmptyDraftOptionsCount >= 2 &&
    Boolean(trimmedDraftOptions[draftCorrect]);

  const resetDraft = () => {
    setDraftText("");
    setDraftOptions([...EMPTY_OPTIONS]);
    setDraftCorrect(0);
    setEditingId(null);
  };

  const handleSaveQuestion = async () => {
    if (!deck || !draftText.trim()) return;

    const trimmedOptions = draftOptions.map((option) => option.trim());
    const nonEmptyOptions = trimmedOptions.filter((option) => Boolean(option));
    if (nonEmptyOptions.length < 2) return;

    // `draftCorrect` is the index in the 0..7 option fields.
    // `correctIndex` is the index in the compacted non-empty `options` array.
    let correctIndex = -1;
    let nonEmptyCount = 0;
    for (let i = 0; i < trimmedOptions.length; i++) {
      if (!trimmedOptions[i]) continue;
      if (i === draftCorrect) correctIndex = nonEmptyCount;
      nonEmptyCount++;
    }
    if (correctIndex < 0) return;

    if (editingId) {
      await db.transact(
        db.tx.questions[editingId].update({
          text: draftText.trim(),
          options: nonEmptyOptions,
          correctIndex,
        }),
      );
    } else {
      const questionId = id();
      await db.transact(
        db.tx.questions[questionId]
          .update({
            text: draftText.trim(),
            options: nonEmptyOptions,
            correctIndex,
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
    setEditingId(questionId);
    setDraftText(question.text);

    const existingOptions = Array.isArray(question.options)
      ? (question.options as string[])
      : [];
    const nextOptions = [...existingOptions, ...EMPTY_OPTIONS].slice(0, 8);
    setDraftOptions(nextOptions);

    setDraftCorrect(
      question.correctIndex >= 0 && question.correctIndex < existingOptions.length
        ? question.correctIndex
        : 0,
    );
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
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back</Link>
        </Button>
      </div>

      <DeckDetailsForm key={deck.id} deck={deck} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Edit question" : "Add question"}
          </CardTitle>
          <CardDescription>
            Each question supports up to 8 answer options (at least 2). Mark
            one of the filled options as correct.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question-text">Question</Label>
            <Textarea
              id="question-text"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              rows={2}
            />
          </div>

          {draftOptions.map((option, index) => {
            const isOptionFilled = Boolean(option.trim());

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="correct"
                      checked={draftCorrect === index}
                      disabled={!isOptionFilled}
                      onChange={() => setDraftCorrect(index)}
                    />
                    Correct
                  </label>
                </div>
                <Input
                  id={`option-${index}`}
                  value={option}
                  onChange={(event) => {
                    const next = [...draftOptions];
                    next[index] = event.target.value;

                    // If the currently-selected correct option was cleared,
                    // fall back to the first filled option.
                    if (index === draftCorrect && !event.target.value.trim()) {
                      const firstFilledIndex = next.findIndex((v) =>
                        Boolean(v.trim()),
                      );
                      setDraftCorrect(firstFilledIndex >= 0 ? firstFilledIndex : 0);
                    }

                    setDraftOptions(next);
                  }}
                />
              </div>
            );
          })}

          <div className="flex gap-2">
            <Button onClick={() => void handleSaveQuestion()} disabled={!canSaveQuestion}>
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
            questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {index + 1}. {question.text}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(question.options as string[]).map((option, optionIndex) => (
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
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
