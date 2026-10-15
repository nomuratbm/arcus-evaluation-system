import { authErrorResponse, requireSession } from "@/lib/auth/session";
import { hasDynamoTableConfig } from "@/lib/dynamodb/client";
import { parseStudentNumber } from "@/lib/student-identity";
import { lookupStudent } from "@/lib/student-lookup";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return authErrorResponse(auth.error);
  const studentId = auth.session.studentId;
  if (!studentId) return Response.json({ error: "Your account has no linked student number." }, { status: 403 });
  const parsed = parseStudentNumber(studentId ?? "");

  if (!parsed) {
    return Response.json(
      { error: "Enter a valid student number" },
      { status: 400 },
    );
  }

  if (!hasDynamoTableConfig()) {
    console.error("DYNAMODB_TABLE_NAME environment variable is not defined");
    return Response.json(
      { error: "Server configuration error: missing table configuration" },
      { status: 500 },
    );
  }

  try {
    const result = await lookupStudent(parsed);

    if (result.status === "invalid") {
      return Response.json(
        { error: "Enter a valid student number" },
        { status: 400 },
      );
    }

    if (result.status === "not_found") {
      return Response.json(
        { error: "Student number is not registered" },
        { status: 404 },
      );
    }

    return Response.json({ student: result.student });
  } catch (error) {
    console.error("Error looking up student:", error);
    return Response.json(
      { error: "Failed to look up student" },
      { status: 500 },
    );
  }
}
