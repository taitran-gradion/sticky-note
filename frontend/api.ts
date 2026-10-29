import { api, ProblemError, throwProblem } from "@margince/frontend/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Target = "page" | "all";

// Every call the floating note makes, one key per page.
const notesKey = (page: string) => ["ext", "sticky-note", "notes", page] as const;

// The page's own note and the note on all pages.
export function useStickyNotes(page: string) {
  return useQuery({
    queryKey: notesKey(page),
    retry: false,
    queryFn: async () => {
      const { data, error } = await api.GET("/ext/sticky-note/notes", { params: { query: { page } } });
      if (error) throwProblem(error);
      return data;
    },
  });
}

// Every note, the most recently edited first.
export function useAllStickyNotes() {
  return useQuery({
    queryKey: ["ext", "sticky-note", "list"],
    queryFn: async () => {
      const { data, error } = await api.GET("/ext/sticky-note/list");
      if (error) throwProblem(error);
      return data.notes;
    },
  });
}

// Saves one of the two notes; a blank body clears it.
export function useSaveStickyNote(page: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ target, body }: { target: Target; body: string }) => {
      const { data, error } = await api.POST("/ext/sticky-note/notes", { body: { page, target, body } });
      if (error) throwProblem(error);
      return data;
    },
    onSuccess: (notes) => {
      client.setQueryData(notesKey(page), notes);
      // The note on all pages shows on every other page too, and every note on the list.
      void client.invalidateQueries({ queryKey: ["ext", "sticky-note"] });
    },
  });
}

function statusOf(error: unknown): number | undefined {
  if (!(error instanceof ProblemError)) return undefined;
  const problem = error.problem;
  return typeof problem === "object" && problem !== null && "status" in problem && typeof problem.status === "number"
    ? problem.status
    : undefined;
}

// Signed out: the note keeps out of the login screen.
export const signedOut = (error: unknown) => statusOf(error) === 401;

// The reader's role does not hold ext_sticky_note_note.
export const refusedForRole = (error: unknown) => statusOf(error) === 403;
