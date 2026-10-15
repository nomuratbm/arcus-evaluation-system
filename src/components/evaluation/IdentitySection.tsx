"use client";

import { Select, SelectGroup, SelectGroupLabel, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENT_VALUES, departmentCampuses } from "@/lib/departments";
import { organizationDisplayName } from "@/lib/student-identity";
import { useEvaluationStore } from "@/store/useEvaluationStore";

export function IdentitySection({ errors }: {
  errors: Partial<Record<"studentId" | "department", string>>;
}) {
  const identity = useEvaluationStore((state) => state.identity);
  const department = useEvaluationStore((state) => state.draft.department);
  const setDepartment = useEvaluationStore((state) => state.setDepartment);
  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-medium text-stone-800">Student details</h2>
        <p className="mt-1 text-sm text-stone-600">These details come from your signed-in student account. Select your department below.</p>
      </div>
      {identity ? <dl className="grid gap-4 sm:grid-cols-2">
        {[["Student number", identity.studentId], ["Name", identity.fullName], ["Program and year", identity.programYear], ["Organization", organizationDisplayName(identity.organizationName)]].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm font-medium text-stone-800">{label}</dt>
            <dd className="mt-1.5 min-h-10 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm break-words text-stone-900">{value}</dd>
          </div>
        ))}
      </dl> : null}
      {errors.studentId ? <p role="alert" className="text-sm text-red-700">{errors.studentId}</p> : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="eval-department" className="text-sm font-medium text-stone-800">Department</label>
        <Select items={DEPARTMENT_VALUES.map((dept) => ({ label: dept, value: dept }))}
          value={department || null} onValueChange={(value) => setDepartment(typeof value === "string" ? value : "")}>
          <SelectTrigger id="eval-department" aria-invalid={!!errors.department}
            aria-describedby={errors.department ? "eval-department-error" : undefined}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectPopup>
            {departmentCampuses.map((group) => <SelectGroup key={group.campus}>
              <SelectGroupLabel>{group.campus}</SelectGroupLabel>
              {group.departments.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
            </SelectGroup>)}
          </SelectPopup>
        </Select>
        {errors.department ? <p id="eval-department-error" className="text-xs text-red-700">{errors.department}</p> : null}
      </div>
    </section>
  );
}
