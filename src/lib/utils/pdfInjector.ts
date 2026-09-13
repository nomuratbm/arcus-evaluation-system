import { PDFDocument } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export interface EvaluationData {
  studentName: string;
  programAndYear: string;
  organization: string;
  studentNumber: string;
  pastParticipation: "Y" | "N";
  recentActivity: string;
  dateParticipated: string;
  awarenessSource: string;
  ratings: Record<string, number>; // 1-23 mapping
  comments: string;
}

export async function injectEvaluationPdf(data: EvaluationData): Promise<Uint8Array> {
  // Load the official evaluation template
  const templatePath = path.join(process.cwd(), "public", "templates", "evaluation-template.pdf");
  const templateBytes = await fs.readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Populate student information fields
  try {
    form.getTextField("Name").setText(data.studentName);
    form.getTextField("Program and Year").setText(data.programAndYear);
    form.getTextField("Organization").setText(data.organization);
    form.getTextField("S.N.").setText(data.studentNumber);

    // Populate background and prior participation details
    form.getTextField("Recent Activity").setText(data.recentActivity);
    form.getTextField("Date Participated").setText(data.dateParticipated);

    // Populate evaluation metrics ratings
    for (let i = 1; i <= 23; i++) {
      const ratingValue = data.ratings[i];
      if (ratingValue) {
        const field = form.getTextField(`Rating_${i}`);
        if (field) field.setText(ratingValue.toString());
      }
    }

    // Populate qualitative feedback and suggestions
    form.getTextField("Comments and suggestions").setText(data.comments);
  } catch (error) {
    console.error("Error mapping fields to PDF AcroForm annotations:", error);
    throw new Error("Failed to inject data into PDF template form fields.");
  }

  // Flatten the form fields so the annotations become part of the static page layer
  form.flatten();

  // Return the finalized PDF document bytes
  return await pdfDoc.save();
}