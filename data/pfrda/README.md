# PFRDA Data (M1 and CSV)

## Automatic refresh (no file upload)

Data can be pulled **automatically** from PFRDA’s official site — no download or upload needed.

- **From the dashboard:** Click **“Refresh from PFRDA”** in the top bar. The app fetches the latest M1 file from PFRDA and updates the database.
- **From the terminal:** Run `npm run sync:pfrda` to fetch and sync M1 (e.g. from a cron job for daily refresh).

No API keys or credentials are used; the app uses the same public download link as the PFRDA statistics page.

---

## Option 1: Import from a local M1 Excel file

Download **M1: PF-wise and Scheme-wise Asset Under Management** from [PFRDA Statistical Data](https://pfrda.org.in/research-publications/statistics/statistical-data) (Monthly section). No need to open or edit the file.

From the project root, run:

```bash
npm run import:m1-excel -- "/path/to/M1_PF-wise and Scheme-wise Asset Under Management.xlsx"
```

Example if the file is in your Downloads folder:

```bash
npm run import:m1-excel -- "/Users/Experiments/Downloads/M1_PF-wise and Scheme-wise Asset Under Management.xlsx"
```

The script reads the "Formatted Report" sheet, maps each Pension Fund (PF) and scheme (CG, SG, NPS Lite, etc.) to `SchemeAumHistory`, and parses month labels (e.g. Apr-2008) as the last day of that month.

---

## Option 2: CSV import (custom CSV)

If you prefer to prepare a CSV yourself (e.g. from another report), use the format below.

For the **CSV** import script to work, create a CSV file with the following columns **in this exact order**:

```text
asOfDate,fundManagerName,schemeName,aumCrore,subscribers
```

- **asOfDate**: The reporting date in `YYYY-MM-DD` format (for example `2025-01-31`).
- **fundManagerName**: Name of the pension fund manager (for example `HDFC Pension Management Company Limited`).
- **schemeName**: Name of the scheme as shown in the report.
- **aumCrore**: Total assets under management in crores (numeric, without commas).
- **subscribers**: Number of subscribers (optional; leave empty if not available).

Example row:

```text
2025-01-31,ABC Pension Fund Management Co.,NPS Equity Scheme - Tier I,52000,1500000
```

Once you have prepared a CSV file, you can import it with:

```bash
npm run import:scheme-aum -- ./data/pfrda/your-file-name.csv
```

