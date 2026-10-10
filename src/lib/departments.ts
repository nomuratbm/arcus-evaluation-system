/**
 * Department catalog backing the evaluation form dropdown.
 *
 * NOTE: Currently seeded from a static list. The dropdown consumes the shapes
 * below, so the source can later be swapped to a DynamoDB query without touching
 * the form components — replace `departmentCampuses` with a server fetch that
 * returns the same `DepartmentCampus`/`SelectOption` structure.
 */
export type SelectOption = { label: string; value: string | null };

export type DepartmentCampus = {
  campus: string;
  departments: readonly string[];
};

export const departmentCampuses: readonly DepartmentCampus[] = [
  {
    campus: "Intramuros Campus",
    departments: [
      "School of Architecture, Industrial Design, and the Built Environment",
      "School of Chemical, Biological, and Materials Engineering and Sciences",
      "School of Civil, Environmental, and Geological Engineering",
      "School of Electrical, Electronics, and Computer Engineering",
      "School of Industrial Engineering and Engineering Management",
      "School of Mechanical, Manufacturing, and Energy Engineering",
      "School of Foundational Studies and Education",
      "Department of Liberal Arts",
      "Department of Mathematics",
      "Department of Physical Education and Athletics",
      "Department of Physics",
      "SHS (Intramuros)",
    ],
  },
  {
    campus: "Makati Campus",
    departments: [
      "School of Information Technology",
      "School of Multimedia and Digital Arts",
      "E.T. Yuchengco School of Business",
      "School of Health Sciences",
      "School of Nursing",
      "School of Medicine",
      "SHS (Makati)",
    ],
  },
  {
    campus: "Seda Hotel, Manila Bay",
    departments: ["School of Tourism and Hospitality Management"],
  },
] as const;

export const departmentItems: SelectOption[] = [
  { label: "Select department", value: null },
  ...departmentCampuses.flatMap((group) =>
    group.departments.map((department) => ({
      label: department,
      value: department,
    })),
  ),
];

/** Flat list of every selectable department value (label === value). */
export const DEPARTMENT_VALUES: readonly string[] = departmentCampuses.flatMap(
  (group) => [...group.departments],
);

const DEPARTMENT_LOOKUP = new Set<string>(DEPARTMENT_VALUES);

/** True when the trimmed value is one of the known departments. */
export function isKnownDepartment(value: string): boolean {
  return DEPARTMENT_LOOKUP.has(value.trim());
}