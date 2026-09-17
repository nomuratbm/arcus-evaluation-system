import { DataExportTable } from "@/components/officer/DataExportTable";

export const metadata = {
  title: "Data export",
  description:
    "List filed student activity evaluations and download FM-SA-05-01 PDFs.",
};

export const dynamic = "force-dynamic";

export default function DataExportPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Data export
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse DynamoDB evaluation records and download PDFs from S3.
        </p>
      </div>
      <div className="mt-8">
        <DataExportTable />
      </div>
    </main>
  );
}
