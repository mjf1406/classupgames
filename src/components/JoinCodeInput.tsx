import { useCallback } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { CODE_INPUT_PATTERN, CODE_LENGTH, sanitizeCodeInput } from "@/lib/game";

type JoinCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
};

export function JoinCodeInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: JoinCodeInputProps) {
  const handleChange = useCallback(
    (next: string) => {
      onChange(sanitizeCodeInput(next));
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        event.key === "Enter" &&
        value.length === CODE_LENGTH &&
        !disabled
      ) {
        event.preventDefault();
        onSubmit?.();
      }
    },
    [disabled, onSubmit, value.length],
  );

  return (
    <InputOTP
      maxLength={CODE_LENGTH}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      pasteTransformer={(pasted) => sanitizeCodeInput(pasted)}
      disabled={disabled}
      inputMode="text"
      autoCapitalize="characters"
      autoCorrect="off"
      pattern={CODE_INPUT_PATTERN}
      containerClassName="justify-center gap-2"
      className="font-mono text-lg tracking-widest"
    >
      <InputOTPGroup className="font-mono">
        <InputOTPSlot index={0} className="size-12 text-lg font-mono" />
        <InputOTPSlot index={1} className="size-12 text-lg font-mono" />
        <InputOTPSlot index={2} className="size-12 text-lg font-mono" />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup className="font-mono">
        <InputOTPSlot index={3} className="size-12 text-lg font-mono" />
        <InputOTPSlot index={4} className="size-12 text-lg font-mono" />
        <InputOTPSlot index={5} className="size-12 text-lg font-mono" />
      </InputOTPGroup>
    </InputOTP>
  );
}
