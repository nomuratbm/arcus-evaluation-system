"use client";

import { useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import { TextField } from "@/components/evaluation/TextField";
import {
  MAX_STUDENT_NUMBER_LENGTH,
  isMatchingIdentity,
  organizationDisplayName,
  parseStudentNumber,
  studentIdentityFromUnknown,
} from "@/lib/student-identity";
import { useEvaluationStore } from "@/store/useEvaluationStore";

type LookupStatus = "idle" | "invalid" | "not_found" | "error";

type IdentitySectionProps = {
  errors: Partial<Record<"studentId" | "department", string>>;
};

function lookupStatusMessage(status: LookupStatus): string {
  if (status === "not_found") {
    return "Student number is not registered.";
  }
  if (status === "invalid") {
    return "Enter a valid student number.";
  }
  if (status === "error") {
    return "Could not look up this student number. Try again.";
  }
  return "Look up this student number to continue.";
}

async function requestStudent(studentId: string, signal: AbortSignal) {
  const response = await fetch(
    `/api/student?student_id=${encodeURIComponent(studentId)}`,
    { signal },
  );
  const data: unknown = await response.json().catch(() => null);

  if (response.status === 400) {
    return { status: "invalid" as const };
  }
  if (response.status === 404) {
    return { status: "not_found" as const };
  }
  if (!response.ok) {
    return { status: "error" as const };
  }

  const student =
    typeof data === "object" && data !== null && "student" in data
      ? studentIdentityFromUnknown(data.student)
      : null;

  if (!student) {
    return { status: "error" as const };
  }

  return { status: "found" as const, student };
}

function IdentityValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-stone-800">{label}</p>
      <p className="flex h-10 items-center rounded-md border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900">
        {value}
      </p>
    </div>
  );
}

export function IdentitySection({ errors }: IdentitySectionProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const appliedQueryRef = useRef(false);

  const studentId = useEvaluationStore((state) => state.draft.studentId);
  const department = useEvaluationStore((state) => state.draft.department);
  const identity = useEvaluationStore((state) => state.identity);
  const setStudentId = useEvaluationStore((state) => state.setStudentId);
  const setDepartment = useEvaluationStore((state) => state.setDepartment);
  const setIdentity = useEvaluationStore((state) => state.setIdentity);

  const resolved = isMatchingIdentity(identity, studentId);

  useEffect(() => {
    if (appliedQueryRef.current) {
      return;
    }
    const fromQuery = searchParams.get("studentId");
    if (!fromQuery?.trim()) {
      return;
    }
    appliedQueryRef.current = true;
    setStudentId(fromQuery.trim());
  }, [searchParams, setStudentId]);

  function lookupCurrentNumber() {
    const parsed = parseStudentNumber(studentId);
    if (!parsed) {
      setIdentity(null);
      setLookupStatus(studentId.trim() ? "invalid" : "idle");
      return;
    }

    if (isMatchingIdentity(identity, parsed)) {
      setLookupStatus("idle");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    startTransition(async () => {
      try {
        const result = await requestStudent(parsed, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        if (result.status === "found") {
          setIdentity(result.student);
          setLookupStatus("idle");
          return;
        }

        setIdentity(null);
        setLookupStatus(
          result.status === "error" ? "error" : result.status,
        );
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setIdentity(null);
        setLookupStatus("error");
      }
    });
  }

  function handleLookupClick(event: FormEvent) {
    event.preventDefault();
    lookupCurrentNumber();
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-stone-800">Student details</h2>
        <p className="mt-1 text-sm text-stone-600">
          Enter your student number to load your name, program and year, and
          current organization. Department is entered here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <TextField
          id="eval-student-id"
          label="Student number"
          value={studentId}
          maxLength={MAX_STUDENT_NUMBER_LENGTH}
          autoComplete="off"
          placeholder="Up to 10 characters"
          error={errors.studentId}
          onChange={(value) => {
            setLookupStatus("idle");
            setStudentId(value);
          }}
          onBlur={lookupCurrentNumber}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              lookupCurrentNumber();
            }
          }}
        />
        <button
          type="button"
          onClick={handleLookupClick}
          disabled={isPending}
          className="h-10 rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Looking up…" : "Look up"}
        </button>
      </div>

      {isPending ? (
        <p className="text-sm text-stone-500" role="status">
          Looking up student number…
        </p>
      ) : resolved ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <IdentityValue label="Name" value={identity.fullName} />
          <IdentityValue label="Program and year" value={identity.programYear} />
          <IdentityValue
            label="Organization"
            value={organizationDisplayName(identity.organizationName)}
          />
        </div>
      ) : studentId.trim() ? (
        <p className="text-sm text-stone-600" role="status">
          {errors.studentId
            ? errors.studentId
            : lookupStatusMessage(lookupStatus)}
        </p>
      ) : null}

      <TextField
        id="eval-department"
        label="Department"
        value={department}
        error={errors.department}
        onChange={setDepartment}
      />
    </section>
  );
}
