import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LeaveGameButtonProps = {
  onLeave: () => void;
  isLeaving?: boolean;
  className?: string;
};

export function LeaveGameButton({
  onLeave,
  isLeaving = false,
  className,
}: LeaveGameButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(className)}
          disabled={isLeaving}
        >
          {isLeaving ? "Leaving..." : "Leave game"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave game?</AlertDialogTitle>
          <AlertDialogDescription>
            You will be removed from the game and need to re-join with the code
            to play again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isLeaving}
            onClick={(event) => {
              event.preventDefault();
              onLeave();
            }}
          >
            {isLeaving ? "Leaving..." : "Leave game"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
