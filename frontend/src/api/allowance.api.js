import api from "./axios";

export const getEmployeeAllowanceReport = ({
  projectId,
  fromDate,
  toDate,
}) =>
  api.get("/allowances/reports/employee-allowance", {
    params: {
      project_id: projectId,
      from_date: fromDate,
      to_date: toDate,
    },
  });
