import { useState, useEffect } from "react";
import { getEmployeeAllowanceReport } from "../api/allowance.api";
import { useAuth } from "../context/AuthContext";
import AllowanceReportTable from "../components/AllowanceReportTable";
import { getLastDayOfMonth } from "../utils/date";
import "../styles/report.css";
import ExcelJS from "exceljs";
import refresh from "../assets/refresh.png";

export default function AllowanceReport() {
  const { projects, selectedProject, setSelectedProject } = useAuth();

  const [month, setMonth] = useState("2025-01");
  const [shifts, setShifts] = useState([]);
  const [rows, setRows] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);


  const formattedMonth = month
    ? new Date(month + "-01").toLocaleString("default", {
        month: "long",
        year: "numeric",
      })
    : "";

  useEffect(() => {
    if (!selectedProject && projects?.length > 0) {
      setSelectedProject(projects[0].project_id);
    }
  }, [projects]);

const handleExport = async () => {
  if (!rows?.length) return;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Allowance Report");

  const totalColumns = 2 + shifts.length + 3;

  /* =========================
     TITLE ROW
  ========================== */

  worksheet.mergeCells(1, 1, 1, totalColumns);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `Allowance Report – ${formattedMonth}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.addRow([]); // empty row

  const headerStartRow = 3;
  const headerEndRow = 5;

  /* =========================
     HEADER ROW 1 – SHIFT NAMES
  ========================== */

  const headerRow1 = [
    "Emp ID",
    "Name",
    ...shifts.map(s => s.shift_name),
    "Weekend Shifts",
    "Holiday Shifts",
    "Grand Total",
  ];

  worksheet.addRow(headerRow1);

  /* =========================
     HEADER ROW 2 – ALLOWANCE
  ========================== */

  const headerRow2 = [
    "",
    "",
    ...shifts.map(s => `₹ ${s.weekday_allowance}`),
    "",
    "",
    "",
  ];

  worksheet.addRow(headerRow2);

  /* =========================
     HEADER ROW 3 – TIME
  ========================== */

  const headerRow3 = [
    "",
    "",
    ...shifts.map(s => `${s.start_time} - ${s.end_time}`),
    "",
    "",
    "",
  ];

  worksheet.addRow(headerRow3);

  /* =========================
     MERGE STATIC COLUMNS
  ========================== */

  worksheet.mergeCells(headerStartRow, 1, headerEndRow, 1); // Emp ID
  worksheet.mergeCells(headerStartRow, 2, headerEndRow, 2); // Name

  const weekendCol = 2 + shifts.length + 1;
  const holidayCol = weekendCol + 1;
  const totalCol = holidayCol + 1;

  worksheet.mergeCells(headerStartRow, weekendCol, headerEndRow, weekendCol);
  worksheet.mergeCells(headerStartRow, holidayCol, headerEndRow, holidayCol);
  worksheet.mergeCells(headerStartRow, totalCol, headerEndRow, totalCol);

  /* =========================
     STYLE HEADERS
  ========================== */

  for (let r = headerStartRow; r <= headerEndRow; r++) {
    worksheet.getRow(r).eachCell(cell => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  }

  /* =========================
     DATA ROWS
  ========================== */

  rows.forEach(r => {
    const rowData = [
      r.emp_id,
      r.emp_name,
      ...shifts.map(s => r.shift_counts?.[s.shift_code] ?? 0),
      r.weekend_shift_count ?? 0,
      r.holiday_shift_count ?? 0,
      r.total_allowance ?? 0,
    ];

    const row = worksheet.addRow(rowData);

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      if (colNumber === totalCol) {
        cell.numFmt = '"₹"#,##0.00';
        cell.font = { bold: true };
      }
    });
  });

  /* =========================
     COLUMN WIDTHS
  ========================== */

  worksheet.columns = [
    { width: 12 },
    { width: 20 },
    ...shifts.map(() => ({ width: 18 })),
    { width: 16 },
    { width: 16 },
    { width: 18 },
  ];

  worksheet.views = [{ state: "frozen", ySplit: 5 }];

  const buffer = await workbook.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Allowance_Report_${formattedMonth}.xlsx`;
  link.click();
};

  const handleLoad = async () => {
    if (!selectedProject || !month) return;

    const [year, mon] = month.split("-");
    const lastDay = getLastDayOfMonth(Number(year), Number(mon));

    const fromDate = `${year}-${mon}-01`;
    const toDate = `${year}-${mon}-${lastDay}`;

    try {
      setLoading(true);
      setHasLoaded(true);

      const res = await getEmployeeAllowanceReport({
        projectId: selectedProject,
        fromDate,
        toDate,
      });

      setShifts(res?.data?.shifts || []);
      setRows(res?.data?.rows || []);
    } catch (err) {
      console.error("Allowance report error:", err);
      setShifts([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <div className="report-filters">
        <select
          value={selectedProject || ""}
          onChange={e => setSelectedProject(Number(e.target.value))}
        >
          {projects.map(p => (
            <option key={p.project_id} value={p.project_id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />

        <button onClick={handleLoad}>Load</button>
        <img src={refresh} alt="Refresh" onClick={handleLoad} className="refresh-icon" />

       {rows?.length > 0 && (
          <button
            className="export-btn"
            onClick={handleExport}
          >
            Export Excel
          </button>
        )}

      </div>

{hasLoaded && (
  <>
    {loading && <div className="empty-state">Loading report...</div>}

    {!loading && rows.length === 0 && (
      <div className="empty-state">
        No data available for selected month
      </div>
    )}

    {!loading && rows.length > 0 && (
      <>
        <AllowanceReportTable
          shifts={shifts}
          rows={rows}
          month={formattedMonth}
        />
      </>
    )}
  </>
)}

    </div>
  );
}
