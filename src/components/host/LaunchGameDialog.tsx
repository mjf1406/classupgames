import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Rocket, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/db";
import {
  DEFAULT_QUESTION_TIME,
  GAME_TYPES,
  generateJoinCode,
  type GameType,
} from "@/lib/game";
import { launchGame } from "@/lib/useHostGameEngine";
import type { QuestionSnapshot } from "@/lib/types";

type LaunchGameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckTitle: string;
  questions: QuestionSnapshot[];
};

export function LaunchGameDialog({
  open,
  onOpenChange,
  deckTitle,
  questions,
}: LaunchGameDialogProps) {
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [gameType, setGameType] = useState<GameType>("submarine");
  const [questionTime, setQuestionTime] = useState(String(DEFAULT_QUESTION_TIME));
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    if (!user || questions.length === 0) return;

    setIsLaunching(true);
    try {
      const code = generateJoinCode();
      await launchGame({
        hostId: user.id,
        code,
        gameType,
        questionsSnapshot: questions,
        questionTimeSeconds: Number(questionTime) || DEFAULT_QUESTION_TIME,
      });

      onOpenChange(false);
      await navigate({ to: "/g/$code", params: { code } });
    } finally {
      setIsLaunching(false);
    }
  };

  const selectedGame = GAME_TYPES.find((type) => type.id === gameType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Launch game</DialogTitle>
          <DialogDescription>
            Launch &ldquo;{deckTitle}&rdquo; with {questions.length} questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Game type</Label>
            <Select
              value={gameType}
              onValueChange={(value) => setGameType(value as GameType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GAME_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      {type.id === "submarine" ? (
                        <Ship className="size-4" />
                      ) : (
                        <Rocket className="size-4" />
                      )}
                      {type.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedGame ? (
              <p className="text-xs text-muted-foreground">
                {selectedGame.description}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-time">Seconds per question</Label>
            <Input
              id="question-time"
              type="number"
              min={10}
              max={60}
              value={questionTime}
              onChange={(event) => setQuestionTime(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => void handleLaunch()}
            disabled={isLaunching || questions.length === 0}
          >
            {isLaunching ? "Launching..." : "Launch game"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
