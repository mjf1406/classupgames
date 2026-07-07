/** @format */

import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { JoinCodeInput } from "@/components/JoinCodeInput";
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
import {
    getStoredNickname,
    getStoredPlayerId,
    signInAsGuest,
    storeNickname,
    storePlayerId,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { CODE_LENGTH } from "@/lib/game";
import { lookupJoinableGame, playerExists, type JoinableGame } from "@/lib/join";
import { generateAnimalNickname } from "@/lib/nicknames";
import { joinGame } from "@/lib/useHostGameEngine";

type JoinPageProps = {
    initialCode?: string;
    preloadedGame?: JoinableGame | null;
    preloadError?: string | null;
};

type Step = "code" | "nickname";

export function JoinPage({
    initialCode = "",
    preloadedGame = null,
    preloadError = null,
}: JoinPageProps) {
    const navigate = useNavigate();
    const { user } = db.useAuth();
    const [step, setStep] = useState<Step>(() =>
        preloadedGame ? "nickname" : "code",
    );
    const [code, setCode] = useState(
        () =>
            preloadedGame?.code ??
            (initialCode
                ? initialCode.toUpperCase().slice(0, CODE_LENGTH)
                : ""),
    );
    const [nickname, setNickname] = useState(() => {
        if (preloadedGame) {
            return getStoredNickname(preloadedGame.code) ?? "";
        }
        return "";
    });
    const [error, setError] = useState<string | null>(() => preloadError);
    const [isLoading, setIsLoading] = useState(false);
    const [gameId, setGameId] = useState<string | null>(
        () => preloadedGame?.id ?? null,
    );

    const validateCode = useCallback(
        async (inputCode: string) => {
            setError(null);
            const upperCode = inputCode.toUpperCase();

            if (upperCode.length !== CODE_LENGTH) {
                setError("Enter a complete 6-character join code.");
                return false;
            }

            setIsLoading(true);
            try {
                const { game, error: lookupError } =
                    await lookupJoinableGame(upperCode);
                if (lookupError || !game) {
                    setError(lookupError ?? "No game found with that code.");
                    return false;
                }

                setCode(upperCode);
                setGameId(game.id);

                const existingPlayerId = getStoredPlayerId(upperCode);
                if (existingPlayerId && (await playerExists(existingPlayerId))) {
                    await navigate({
                        to: "/g/$code",
                        params: { code: upperCode },
                    });
                    return true;
                }

                return true;
            } catch {
                setError("Could not verify that code. Please try again.");
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        [navigate],
    );

    const handleContinue = async () => {
        const valid = await validateCode(code);
        if (valid) {
            setStep("nickname");
        }
    };

    const handleGenerateNickname = () => {
        setNickname(generateAnimalNickname());
    };

    const handleJoin = async () => {
        setError(null);

        if (!nickname.trim()) {
            setError("Enter a nickname or generate one.");
            return;
        }

        if (!gameId) {
            setError("Game not found. Go back and re-enter your code.");
            return;
        }

        setIsLoading(true);
        try {
            const upperCode = code.toUpperCase();
            const joinUser = user ?? (await signInAsGuest());
            const trimmedNickname = nickname.trim();
            const playerId = await joinGame({
                gameId,
                userId: joinUser.id,
                nickname: trimmedNickname,
            });
            storePlayerId(upperCode, playerId);
            storeNickname(upperCode, trimmedNickname);
            await navigate({ to: "/g/$code", params: { code: upperCode } });
        } catch {
            setError("Could not join the game. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="mx-auto flex min-h-screen max-w-lg items-center px-6 py-10">
            <Card className="w-full border-primary/20">
                <CardHeader>
                    <CardTitle>
                        {step === "code"
                            ? "Enter join code"
                            : "Pick a nickname"}
                    </CardTitle>
                    <CardDescription>
                        {step === "code"
                            ? "Enter the 6-character code from your host."
                            : "Choose a name your squad will see in the game."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {step === "code" ? (
                        <>
                            <div className="space-y-2">
                                <Label>Join code</Label>
                                <JoinCodeInput
                                    value={code}
                                    onChange={setCode}
                                    onSubmit={() => void handleContinue()}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button
                                size="lg"
                                className="w-full"
                                disabled={
                                    isLoading || code.length !== CODE_LENGTH
                                }
                                onClick={() => void handleContinue()}
                            >
                                {isLoading ? "Checking..." : "Continue"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-center">
                                <p className="text-xs text-muted-foreground">
                                    Joining game
                                </p>
                                <p className="font-mono text-lg font-semibold tracking-widest">
                                    {code.slice(0, 3)} {code.slice(3)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nickname">Nickname</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="nickname"
                                        placeholder="Type your nickname or generate one"
                                        value={nickname}
                                        onChange={(event) =>
                                            setNickname(event.target.value)
                                        }
                                        disabled={isLoading}
                                        maxLength={24}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleGenerateNickname}
                                        disabled={isLoading}
                                        aria-label="Generate a funny name"
                                    >
                                        <Sparkles className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                className="w-full"
                                disabled={isLoading || !nickname.trim()}
                                onClick={() => void handleJoin()}
                            >
                                {isLoading ? "Joining..." : "Join game"}
                            </Button>

                            <Button
                                variant="ghost"
                                className="w-full"
                                disabled={isLoading}
                                onClick={() => {
                                    setStep("code");
                                    setError(null);
                                }}
                            >
                                Back to code
                            </Button>
                        </>
                    )}

                    {error ? (
                        <p className="text-center text-sm text-destructive">
                            {error}
                        </p>
                    ) : null}
                </CardContent>
            </Card>
        </main>
    );
}
